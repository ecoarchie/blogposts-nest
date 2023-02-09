import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepositoryService } from './users.repository';

describe('UsersRepositoryService', () => {
  let service: UsersRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersRepositoryService],
    }).compile();

    service = module.get<UsersRepositoryService>(UsersRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});