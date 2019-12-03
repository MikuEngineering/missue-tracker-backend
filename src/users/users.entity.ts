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

    @Column({ default: 'no-reply@example.com' })
    email: string;

    @Column()
    password: string;

    @Column({ default: 0 })
    status: number;

    @Column({ default: 0 })
    permission: number;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    created_date: Date;

    @OneToMany(_ => Project, project => project.owner)
    projects: Project[];
}
