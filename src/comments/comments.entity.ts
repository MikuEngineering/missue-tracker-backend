import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Issue } from '../issues/issues.entity';

export enum Status {
  Normal = 0,
  Hidden,
}

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
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
