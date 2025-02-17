import { Test, TestingModule } from '@nestjs/testing';
import { GptService } from './openai.service';

describe('OpenaiService', () => {
  let service: GptService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GptService],
    }).compile();

    service = module.get<GptService>(GptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
