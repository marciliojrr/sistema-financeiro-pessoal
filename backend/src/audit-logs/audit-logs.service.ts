import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async logChange(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    changes?: any,
  ) {
    const log = this.auditLogRepository.create({
      userId,
      action,
      entity,
      entityId,
      changes,
    });
    await this.auditLogRepository.save(log);
  }
}
