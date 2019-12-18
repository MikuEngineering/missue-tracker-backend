import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, ManyToMany } from 'typeorm';
import { User } from '../users/users.entity';
import { Tag } from '../tags/tags.entity';

export enum Privacy {
  Public = 0,
  Private,
};

export enum Status {
  Normal = 0,
  Deleted,
};

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(_ => User, user => user.ownedProjects, { cascade: true, nullable: false })
  owner: User;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  privacy: number;

  @Column({ default: Status.Normal })
  status: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_time: Date;

  @OneToMany(_ => Tag, tag => tag.project)
  tags: Tag[];

  @ManyToMany(_ => User, user => user.participatingProjects)
  participants: User[];
}
