import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Label } from './labels.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { ReadLabelDto } from './dto/read-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { Permission } from '../users/users.entity';
import { OperationResult } from '../common/types/operation-result.type';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
  ) {}

  async create(createLabelDto: CreateLabelDto) {
    const label = await this.labelRepository.findOne({
      name: createLabelDto.name,
      project: { id: createLabelDto.projectId },
    });

    if (label) {
      const { deprecated } = label;
      if (!deprecated) {
        return OperationResult.Conflict;
      }

      await this.reuseDeprecatedLabel(label, createLabelDto);
    }
    else {
      await this.createNewLabel(createLabelDto);
    }

    return OperationResult.Success;
  }

  private async reuseDeprecatedLabel(label: Label, createLabelDto: CreateLabelDto) {
    label.name = createLabelDto.name;
    label.description = createLabelDto.description;
    label.color = createLabelDto.color;
    label.deprecated = false;
    await this.labelRepository.save(label);
  }

  private async createNewLabel(createLabelDto: CreateLabelDto) {
    const label = this.labelRepository.create({
      name: createLabelDto.name,
      description: createLabelDto.description,
      color: createLabelDto.color,
      project: { id: createLabelDto.projectId },
    });
    await this.labelRepository.save(label);
  }

  async readOneById(labelId: number): Promise<[OperationResult, ReadLabelDto?]> {
    const label = await this.labelRepository.findOne(labelId);
    if (!label) {
      return [OperationResult.NotFound, null];
    }

    const readLabelDto: ReadLabelDto = {
      name: label.name,
      description: label.description,
      color: label.color,
      deprecated: label.deprecated,
    };
    return [OperationResult.Success, readLabelDto];
  }

  async updateOneById(
    labelId: number,
    updateLabelDto: UpdateLabelDto,
    userId: number,
    permission: Permission,
  )
  {
    const label = await this.labelRepository
      .createQueryBuilder('label')
      .leftJoinAndSelect('label.project', 'project')
      .leftJoinAndSelect('project.owner', 'owner')
      .where('label.id = :labelId', { labelId })
      .getOne();

    if (!label) {
      return OperationResult.NotFound;
    }

    const { project } = label;
    const isOwner = project.owner.id === userId;
    const isAdmin = permission === Permission.Admin;
    if (!isOwner && !isAdmin) {
      return OperationResult.Forbidden;
    }

    const count = await this.labelRepository.count({
      where: {
        id: Not(labelId),
        name: updateLabelDto.name,
        project
      }
    });
    if (count > 0) {
      return OperationResult.Conflict;
    }

    label.name = updateLabelDto.name;
    label.description = updateLabelDto.description;
    label.color = updateLabelDto.color;
    await this.labelRepository.save(label);
    return OperationResult.Success;
  }

  async removeOneById(
    labelId: number,
    userId: number,
    permission: Permission,
  ): Promise<OperationResult>
  {
    const label = await this.labelRepository
      .createQueryBuilder('label')
      .leftJoinAndSelect('label.project', 'project')
      .leftJoinAndSelect('project.owner', 'owner')
      .where('label.id = :labelId', { labelId })
      .getOne();

    if (!label) {
      return OperationResult.NotFound;
    }

    const { project } = label;
    const isOwner = project.owner.id === userId;
    const isAdmin = permission === Permission.Admin;
    if (!isOwner && !isAdmin) {
      return OperationResult.Forbidden;
    }

    await this.labelRepository.remove(label);
    return OperationResult.Success;
  }
}
