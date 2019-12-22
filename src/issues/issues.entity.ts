import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Project } from '../projects/projects.entity';
import { Label } from '../labels/labels.entity';
import { Comment } from '../comments/comments.entity';

export enum Status {
  Open = 0,
  Closed,
};

@Entity()
@Index(['number', 'project'], { unique: true })
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  number: number;

  @Column()
  title: string;

  @Column({ default: Status.Open })
  status: string;

  @CreateDateColumn()
  createdTime: Date;

  @UpdateDateColumn()
  updatedTime: Date;

  @ManyToOne(_ => Project, project => project.issues)
  project: Project;

  @ManyToMany(_ => Label, label => label.issues)
  @JoinTable()
  labels: Label[];

  @ManyToMany(_ => User, user => user.assignedIssues)
  assignees: User[];

  @ManyToMany(_ => User, user => user.subscribedIssues)
  subscribers: User[];

  @ManyToOne(_ => User, user => user.ownedIssues)
  owner: User;

  @OneToMany(_ => Comment, comment => comment.issue)
  comments: Comment[];
}
