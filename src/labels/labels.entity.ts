import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany } from 'typeorm';
import { Project } from '../projects/projects.entity';
import { Issue } from '../issues/issues.entity';

@Entity()
export class Label {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  description: string

  @Column()
  color: string

  @Column({ default: false })
  deprecated: boolean

  @ManyToOne(_ => Project, project => project.labels, { cascade: ['remove'], nullable: false })
  project: Project

  @ManyToMany(_ => Issue, issue => issue.labels)
  issues: Issue[];
};
