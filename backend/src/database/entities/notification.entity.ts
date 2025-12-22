import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, (profile) => profile.notifications, {
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  read: boolean;

  @Column({ length: 50 })
  type: string; // e.g. 'BUDGET_ALERT', 'DEBT_DUE', 'SYSTEM'

  @CreateDateColumn()
  createdAt: Date;
}
