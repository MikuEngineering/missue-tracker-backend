import { Entity, PrimaryColumn, ManyToOne } from 'typeorm';
import { Project } from '../projects/projects.entity';

@Entity()
export class Tag {
  @PrimaryColumn()
  name: string;

  @ManyToOne(_ => Project, project => project.tags, { cascade: true, nullable: false, primary: true })
  project: Project;
}
