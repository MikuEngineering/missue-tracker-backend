import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Project } from '../projects/projects.entity';

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
};
