import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Profile } from './profile.entity';
import { FinancialCategory } from './financial-category.entity';

export enum MovementType {
    INCOME = 'income',
    EXPENSE = 'expense'
}

@Entity('financial_movements')
export class FinancialMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column( { type: 'decimal', precision: 10, scale: 2})
    amount: number;

    @Column({ type: 'enum', enum: MovementType})
    type: MovementType;

    @Column({ type: 'date' })
    date: Date;

    @Column({ nullable: true })
    notes?: string;

    @ManyToOne(() => Profile, profile => profile.FinancialMovements)
    profile: Profile;

    @ManyToOne(() => FinancialCategory, category => category.FinancialMovements)
    category: FinancialCategory;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}