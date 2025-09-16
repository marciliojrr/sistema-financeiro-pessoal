import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Profile } from './profile.entity';
import { FinancialMovement } from './financial-movement.entity';

@Entity()
export class FinancialCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    type: string;

    @ManyToOne(() => Profile, (profile) => profile.categories)
    profile: Profile;

    @Column({ default: true })
    active: boolean;

    @OneToMany(() => FinancialMovement, movement => movement.category)
    financialMovements: FinancialMovement[];
}
