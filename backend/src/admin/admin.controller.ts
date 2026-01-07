import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Post('run-migrations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa migrations pendentes (apenas admin)' })
  async runMigrations() {
    try {
      const pendingMigrations = await this.dataSource.showMigrations();

      if (!pendingMigrations) {
        return {
          success: true,
          message: 'Nenhuma migration pendente',
          executed: [],
        };
      }

      const executedMigrations = await this.dataSource.runMigrations();

      return {
        success: true,
        message: `${executedMigrations.length} migration(s) executada(s)`,
        executed: executedMigrations.map((m) => m.name),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao executar migrations',
        error: error.message,
      };
    }
  }

  @Post('convert-transfers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Converte transações antigas [TRANSF] para novos tipos',
  })
  async convertTransfers() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Verificar se os novos tipos existem no enum
      const enumCheck = await queryRunner.query(`
        SELECT enumlabel FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'financial_movements_type_enum')
      `);

      const existingValues = enumCheck.map(
        (r: { enumlabel: string }) => r.enumlabel,
      );

      // Adicionar novos valores ao enum se necessário
      if (!existingValues.includes('transfer_out')) {
        await queryRunner.query(
          `ALTER TYPE financial_movements_type_enum ADD VALUE 'transfer_out'`,
        );
      }
      if (!existingValues.includes('transfer_in')) {
        await queryRunner.query(
          `ALTER TYPE financial_movements_type_enum ADD VALUE 'transfer_in'`,
        );
      }

      // Contar transações a serem convertidas
      const countOut = await queryRunner.query(`
        SELECT COUNT(*) as count FROM financial_movements WHERE description LIKE '%[TRANSF OUT]%'
      `);
      const countIn = await queryRunner.query(`
        SELECT COUNT(*) as count FROM financial_movements WHERE description LIKE '%[TRANSF IN]%'
      `);

      // Converter transações [TRANSF OUT]
      await queryRunner.query(`
        UPDATE financial_movements
        SET 
          type = 'transfer_out',
          description = REPLACE(description, '[TRANSF OUT] ', '')
        WHERE description LIKE '%[TRANSF OUT]%'
      `);

      // Converter transações [TRANSF IN]
      await queryRunner.query(`
        UPDATE financial_movements
        SET 
          type = 'transfer_in',
          description = REPLACE(description, '[TRANSF IN] ', '')
        WHERE description LIKE '%[TRANSF IN]%'
      `);

      return {
        success: true,
        message: 'Conversão concluída',
        converted: {
          transferOut: parseInt(countOut[0].count),
          transferIn: parseInt(countIn[0].count),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro na conversão',
        error: error.message,
      };
    } finally {
      await queryRunner.release();
    }
  }
}
