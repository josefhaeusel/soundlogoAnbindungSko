import { Test, TestingModule } from '@nestjs/testing'
import { MusicAiSearchController } from './music-ai-search.controller'

describe('MusicAiSearchController', () => {
  let controller: MusicAiSearchController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MusicAiSearchController],
    }).compile()

    controller = module.get<MusicAiSearchController>(MusicAiSearchController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
