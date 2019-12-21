import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { Project } from '../projects/projects.entity';

@Entity()
export class Label {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 50 })
  @Unique(['name', 'project'])
  name: string

  @Column({ length: 250 })
  description: string

  @Column({ length: 6 })
  color: string

  @Column({ default: false })
  deprecated: boolean

  @ManyToOne(_ => Project, project => project.labels, { cascade: ['remove'], nullable: false })
  project: Project
};
