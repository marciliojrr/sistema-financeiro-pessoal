import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Profile } from './profile.entity';

@Entity()
export class CategoriaFinanceira {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    type: string;

    @ManyToOne(() => Profile, (profile) => profile.categorias)
    profile: Profile;

    @Column({ default: true })
    active: boolean;
}
