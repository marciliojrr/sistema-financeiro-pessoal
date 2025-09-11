import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { CategoriaFinanceira } from './categoria.entity';

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

    @OneToMany(() => CategoriaFinanceira, (categoria) => categoria.profile)
    categorias: CategoriaFinanceira[];
}