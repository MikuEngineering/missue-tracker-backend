import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../users/users.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(_ => User, user => user.projects, { cascade: true, nullable: false })
  owner: User;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  privacy: number;

  @Column()
  status: number;

  @Column()
  created_time: Date;
}
