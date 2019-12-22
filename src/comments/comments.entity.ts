import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Issue } from '../issues/issues.entity';

export enum Status {
  Normal = 0,
  Hidden,
}

@Entity()
@Index(['createdTime', 'issue'])
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column({ default: Status.Normal })
  status: Status;

  @CreateDateColumn()
  createdTime: Date;

  @UpdateDateColumn()
  updatedTime: Date;

  @ManyToOne(_ => User, user => user.ownedComments)
  owner: User;

  @ManyToOne(_ => Issue, issue => issue.comments)
  issue: Issue;
}
