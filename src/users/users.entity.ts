import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Project } from '../projects/projects.entity';

enum Status {
  Normal = 0,
  Banned,
}

enum Permission {
  User = 0,
  Admin,
}


@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 180, unique: true })
  username: string;

  @Column()
  nickname: string;

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
  projects: Project[];
}
