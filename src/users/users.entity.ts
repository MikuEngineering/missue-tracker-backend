import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Project } from '../projects/projects.entity';

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

  @OneToMany(_ => Project, project => project.owner)
  ownedProjects: Project[];

  @ManyToMany(_ => Project, project => project.participants)
  @JoinTable()
  participatingProjects: Project[];
}
