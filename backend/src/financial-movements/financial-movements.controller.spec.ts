import { Test, TestingModule } from '@nestjs/testing';
import { FinancialMovementsController } from './financial-movements.controller';

describe('FinancialMovementsController', () => {
  let controller: FinancialMovementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialMovementsController],
    }).compile();

    controller = module.get<FinancialMovementsController>(FinancialMovementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
