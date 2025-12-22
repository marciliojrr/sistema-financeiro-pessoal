import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { time } from 'console';
import { platform, version } from 'os';
import { uptime } from 'process';
import { Connection } from 'typeorm';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@UseGuards(JwtAuthGuard)
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  async check() {
    let databaseStatus = 'Disconnected';

    try {
      await this.connection.query('SELECT 1');
      databaseStatus = 'Connected';
    } catch (error) {
      databaseStatus = 'Error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Sistema Financeiro Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: databaseStatus,
    };
  }

  @Public()
  @Get('detailed')
  async detailedCheck() {
    let databaseStatus = 'Disconnected';
    let databaseInfo = {};

    try {
      const result = await this.connection.query(
        'SELECT version() as version, now() as current_time',
      );
      databaseStatus = 'Connected';
      databaseInfo = result[0];
    } catch (error) {
      databaseStatus = 'Error';
      databaseInfo = { error: error.message };
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Sistema Financeiro Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      database: {
        status: databaseStatus,
        ...databaseInfo,
      },
    };
  }
}
