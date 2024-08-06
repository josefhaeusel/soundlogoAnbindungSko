import { Test, TestingModule } from '@nestjs/testing'
import { MusicAiSearchService } from './music-ai-search.service'

describe('MusicAiSearchService', () => {
  let service: MusicAiSearchService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MusicAiSearchService],
    }).compile()

    service = module.get<MusicAiSearchService>(MusicAiSearchService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
