import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { AuditLog } from '../../audit-logs/audit-log.entity';

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

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
