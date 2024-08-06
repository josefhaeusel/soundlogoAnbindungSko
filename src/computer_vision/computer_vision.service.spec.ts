import { Test, TestingModule } from '@nestjs/testing'
import { ComputerVisionService } from './computer_vision.service'

describe('ComputerVisionService', () => {
  let service: ComputerVisionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComputerVisionService],
    }).compile()

    service = module.get<ComputerVisionService>(ComputerVisionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
