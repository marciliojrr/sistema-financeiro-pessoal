import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../database/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE'

  @Column()
  entity: string; // Nome da entidade, ex: 'FinancialCategory'

  @Column()
  entityId: string; // ID da entidade afetada

  @Column('json', { nullable: true })
  changes: any; // Detalhes da mudança (antes/depois)

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
