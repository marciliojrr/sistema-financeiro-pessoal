import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { FinancialMovement } from './financial-movement.entity';

@Entity('financial_scenarios')
export class FinancialScenario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  // Data de referência para a simulação (ex: "E se eu começar mês que vem?")
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  baseDate: Date;

  @ManyToOne(() => Profile, (profile) => profile.scenarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @OneToMany(() => FinancialMovement, (movement) => movement.scenario)
  movements: FinancialMovement[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
