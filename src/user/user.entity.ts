import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { create } from 'domain';

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
}
