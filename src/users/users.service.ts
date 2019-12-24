import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, Status, Permission } from './users.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ReadProfileDto } from './dto/read-profile.dto';
import { OperationResult } from '../common/types/operation-result.type';
import { Project, Privacy } from '../projects/projects.entity';
import { Issue } from '../issues/issues.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }

  async register(registerUserDto: RegisterUserDto): Promise<boolean> {
    const username: string = registerUserDto.username;
    const password: string = registerUserDto.password;
    const nickname: string = username;

    const user = await this.userRepository.findOne({ username });
    if (user) {
      return false;
    }

    const newUser = await this.userRepository.create({
      username, password, nickname,
    });
    await this.userRepository.save(newUser);

    return true;
  }

  async findOneByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({ username });
  }

  async findOne(id: number): Promise<User> {
    return this.userRepository.findOne({ id });
  }

  async readProfileById(userId: number): Promise<ReadProfileDto | null> {
    const user = await this.findOne(userId);
    if (!user) {
      return null;
    }

    const readProfileDto: ReadProfileDto = new ReadProfileDto();
    readProfileDto.username = user.username;
    readProfileDto.nickname = user.nickname;
    readProfileDto.email = user.email;
    readProfileDto.autobiography = user.autobiography;
    readProfileDto.permission = user.permission;
    readProfileDto.status = user.status;
    readProfileDto.lineToken = user.lineToken;

    return readProfileDto;
  }

  async updateProfile(updateProfileDto: UpdateProfileDto, userId: number): Promise<boolean> {
    if (!(await this.checkUserExistenceById(userId))) {
      return false;
    }

    await this.userRepository.update({ id: userId }, {
      nickname: updateProfileDto.nickname,
      autobiography: updateProfileDto.autobiography,
      email: updateProfileDto.email,
      lineToken: updateProfileDto.lineToken || null,
    });

    return true;
  }

  async banUserById(userId: number): Promise<boolean> {
    if (!(await this.checkUserExistenceById(userId))) {
      return false;
    }

    await this.userRepository.update({ id: userId }, { status: Status.Banned });
    return true;
  }

  async unbanUserById(userId: number): Promise<boolean> {
    if (!(await this.checkUserExistenceById(userId))) {
      return false;
    }

    await this.userRepository.update({ id: userId }, { status: Status.Normal });
    return true;
  }

  async readAllProjectIdsById(userId: number): Promise<[OperationResult, number[]]> {
    const user = await this.userRepository.findOne({ id: userId }, {
      relations: ['participatingProjects']
    });

    if (!user) {
      return [OperationResult.NotFound, null];
    }

    const projectIds = user.participatingProjects.map(project => project.id);

    return [OperationResult.Success, projectIds];
  }

  private async checkUserExistenceById(userId: number): Promise<boolean> {
    const count = await this.userRepository.count({ id: userId });
    return count > 0;
  }

  async readAllIssues(
    targetUserId: number,
    userId?: number,
    permission?: Permission,
  ): Promise<[OperationResult, number[]?]>
  {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.assignedIssues', 'assignedIssues')
      .leftJoinAndSelect('user.ownedIssues', 'ownedIssues')
      .where('user.id = :targetUserId', { targetUserId })
      .select(['user.id', 'assignedIssues.id', 'ownedIssues.id'])
      .getOne();

    if (!user) {
      return [OperationResult.NotFound, null];
    }

    // Remove duplicated issue ids
    const assignedIssueIds = user.assignedIssues.map(issue => issue.id);
    const ownedIssueIds = user.ownedIssues.map(issue => issue.id);
    const duplicatedItemIndexsOfA = [];
    assignedIssueIds.forEach((issueId, index) => {
      if (ownedIssueIds.includes(issueId)) {
        duplicatedItemIndexsOfA.push(index);
      }
    });
    duplicatedItemIndexsOfA.forEach(index => assignedIssueIds.splice(index, 1));
    const uniqueIssueIds = assignedIssueIds.concat(ownedIssueIds);

    // Return all issue ids directly if the user is an admin.
    if (permission === Permission.Admin) {
      return [OperationResult.Success, uniqueIssueIds];
    }

    // Get relationship between issues and projects
    const manager = this.userRepository.manager;
    const uniqueIssuesProjects = await manager.createQueryBuilder(Issue, 'issue')
      .leftJoinAndSelect('issue.project', 'project')
      .select(['issue.id', 'project.id', 'project.privacy'])
      .where('issue.id IN :set', { set: [uniqueIssueIds] })
      .getMany();

    // Make project-issue Info.
    const issueProjectList = uniqueIssuesProjects.map(issue => ({
      issueId: issue.id,
      projectId: issue.project.id,
      isPublic: issue.project.privacy === Privacy.Public,
    }));

    // Make unique project id list.
    const uniqueProjects = [];
    issueProjectList.forEach((item) => {
      const { projectId, isPublic } = item;
      if (!uniqueProjects.some(item => item.id === projectId)) {
        uniqueProjects.push({ projectId, isPublic });
      }
    });

    // The function of checking whether the user is in the project.
    const projectParticipationMap = {};

    async function checkParticipant({ projectId, isPublic }) {
      if (isPublic) { // The project is public
        projectParticipationMap[projectId] = true;
        return;
      }

      if (!userId) {  // The project is private and the user has not logged in.
        projectParticipationMap[projectId] = false;
        return;
      }

      // The user has logged in, then check whether the user is a participant of this project.
      const count = await manager.count(Project, {
        where: {
          id: projectId,
          participants: { id: userId },
        },
        relations: ['participants'],
      });
      projectParticipationMap[projectId] = count > 0;
    }
    const checkParticipantProcesses = uniqueProjects.map(item => checkParticipant(item));
    await Promise.all(checkParticipantProcesses);

    // Filter out invisible issues.
    const visibleItem = issueProjectList.filter((pair) => {
      return projectParticipationMap[pair.projectId];
    });

    const visibleIssueIds = visibleItem.map(item => item.issueId);
    return [OperationResult.Success, visibleIssueIds];
  }
}
