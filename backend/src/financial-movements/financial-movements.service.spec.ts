import { Test, TestingModule } from '@nestjs/testing';
import { FinancialMovementsService } from './financial-movements.service';

describe('FinancialMovementsService', () => {
  let service: FinancialMovementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialMovementsService],
    }).compile();

    service = module.get<FinancialMovementsService>(FinancialMovementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
