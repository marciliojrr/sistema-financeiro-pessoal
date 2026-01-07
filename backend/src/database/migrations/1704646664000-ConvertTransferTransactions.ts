import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para converter transações antigas com [TRANSF OUT] e [TRANSF IN]
 * na descrição para os novos tipos TRANSFER_OUT e TRANSFER_IN.
 * 
 * Esta migration também limpa a descrição removendo os prefixos antigos.
 */
export class ConvertTransferTransactions1704646664000 implements MigrationInterface {
  name = 'ConvertTransferTransactions1704646664000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Primeiro, adicionar os novos valores ao enum (se ainda não existirem)
    // PostgreSQL requer ALTER TYPE para adicionar valores a enums existentes
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'transfer_out' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'financial_movements_type_enum')) THEN
          ALTER TYPE financial_movements_type_enum ADD VALUE 'transfer_out';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'transfer_in' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'financial_movements_type_enum')) THEN
          ALTER TYPE financial_movements_type_enum ADD VALUE 'transfer_in';
        END IF;
      END
      $$;
    `);

    // Converter transações com [TRANSF OUT] para tipo transfer_out
    await queryRunner.query(`
      UPDATE financial_movements
      SET 
        type = 'transfer_out',
        description = REPLACE(description, '[TRANSF OUT] ', '')
      WHERE description LIKE '%[TRANSF OUT]%'
    `);

    // Converter transações com [TRANSF IN] para tipo transfer_in
    await queryRunner.query(`
      UPDATE financial_movements
      SET 
        type = 'transfer_in',
        description = REPLACE(description, '[TRANSF IN] ', '')
      WHERE description LIKE '%[TRANSF IN]%'
    `);

    console.log('Migration concluída: Transações antigas com [TRANSF] convertidas para novos tipos.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter: adicionar prefixos de volta e mudar tipo
    await queryRunner.query(`
      UPDATE financial_movements
      SET 
        type = 'expense',
        description = CONCAT('[TRANSF OUT] ', description)
      WHERE type = 'transfer_out'
    `);

    await queryRunner.query(`
      UPDATE financial_movements
      SET 
        type = 'income',
        description = CONCAT('[TRANSF IN] ', description)
      WHERE type = 'transfer_in'
    `);

    // Nota: Não é possível remover valores de um enum no PostgreSQL facilmente
    // Os valores transfer_out e transfer_in permanecerão no enum após a reversão

    console.log('Migration revertida: Transações voltaram para tipos expense/income com prefixos [TRANSF].');
  }
}
