import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { FinancialCategory } from './category.entity';

@Entity()
export class Profile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    active: boolean;

    @ManyToOne(() => User, (user) => user.profiles)
    user: User;

    @OneToMany(() => FinancialCategory, (category) => category.profile)
    categories: FinancialCategory[];
}