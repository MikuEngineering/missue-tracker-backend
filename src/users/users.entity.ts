import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Project } from '../projects/projects.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    nickname: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column()
    status: number;

    @Column()
    permission: number;

    @Column()
    created_date: Date;

    @OneToMany(_ => Project, project => project.owner)
    projects: Project[];
}
