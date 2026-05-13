import { Test, TestingModule } from '@nestjs/testing';
import { LinkCollectionsService } from './link-collections.service';

describe('LinkCollectionsService', () => {
  let service: LinkCollectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LinkCollectionsService],
    }).compile();

    service = module.get<LinkCollectionsService>(LinkCollectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
