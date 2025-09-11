import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Profile } from './profile.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @OneToMany(() => Profile, (profile) => profile.user)
    profiles: Profile[];
}