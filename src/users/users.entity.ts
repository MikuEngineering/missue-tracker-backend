import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Project } from '../projects/projects.entity';
import { Issue } from '../issues/issues.entity';
import { Comment } from '../comments/comments.entity';

export enum Status {
  Normal = 0,
  Banned,
}

export enum Permission {
  User = 0,
  Admin,
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 180, unique: true })
  username: string;

  @Column({ length: 180 })
  nickname: string;

  @Column({ default: '' })
  autobiography: string;

  @Column({ default: 'noreply@example.com' })
  email: string;

  @Column()
  password: string;

  @Column({ default: Status.Normal })
  status: number;

  @Column({ default: Permission.User })
  permission: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_date: Date;

  @Column({ default: null, nullable: true })
  lineToken: string;

  @OneToMany(_ => Project, project => project.owner)
  ownedProjects: Project[];

  @ManyToMany(_ => Project, project => project.participants)
  @JoinTable()
  participatingProjects: Project[];

  @ManyToMany(_ => Issue, issue => issue.assignees)
  @JoinTable()
  assignedIssues: Issue[];

  @ManyToMany(_ => Issue, issue => issue.subscribers)
  @JoinTable()
  subscribedIssues: Issue[];

  @OneToMany(_ => Issue, issue => issue.owner)
  ownedIssues: Issue[];

  @OneToMany(_ => Comment, comment => comment.owner)
  ownedComments: Comment[];
}
