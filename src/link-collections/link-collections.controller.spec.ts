import { Test, TestingModule } from '@nestjs/testing';
import { LinkCollectionsController } from './link-collections.controller';

describe('LinkCollectionsController', () => {
  let controller: LinkCollectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkCollectionsController],
    }).compile();

    controller = module.get<LinkCollectionsController>(LinkCollectionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
