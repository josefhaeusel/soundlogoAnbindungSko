import { Test, TestingModule } from '@nestjs/testing'
import { ChordRetrievalAiService } from './chord_retrieval_ai.service'

describe('ChordRetrievalAiService', () => {
  let service: ChordRetrievalAiService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChordRetrievalAiService],
    }).compile()

    service = module.get<ChordRetrievalAiService>(ChordRetrievalAiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
