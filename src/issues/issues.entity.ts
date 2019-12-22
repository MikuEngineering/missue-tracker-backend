import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Project } from '../projects/projects.entity';
import { Label } from '../labels/labels.entity';

export enum Status {
  Open = 0,
  Closed,
};

@Entity()
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  status: string;

  @CreateDateColumn()
  createdTime: Date;

  @UpdateDateColumn()
  updatedTime: Date;

  @ManyToOne(_ => Project, project => project.issues)
  project: Project;
}
