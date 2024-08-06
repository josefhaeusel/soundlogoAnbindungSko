import { Test, TestingModule } from '@nestjs/testing'
import { ChordRetrievalAiController } from './chord_retrieval_ai.controller'
import { ChordRetrievalAiService } from './chord_retrieval_ai.service'

describe('ChordRetrievalAiController', () => {
  let controller: ChordRetrievalAiController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChordRetrievalAiController],
      providers: [ChordRetrievalAiService],
    }).compile()

    controller = module.get<ChordRetrievalAiController>(
      ChordRetrievalAiController,
    )
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
