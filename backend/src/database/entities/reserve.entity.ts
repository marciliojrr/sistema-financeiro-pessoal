import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('reserves')
export class Reserve {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, (profile) => profile.reserves, {
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  targetAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentAmount: number;

  @Column({ type: 'date', nullable: true })
  targetDate: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 7, default: '#000000' })
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt?: Date;

  @Column({ default: false })
  autoSave: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  autoSaveAmount: number;

  @Column({ type: 'int', default: 1 })
  autoSaveDay: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
