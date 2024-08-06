import { Test, TestingModule } from '@nestjs/testing'
import { AudioVideoService } from './audio-video.service'

describe('AudioVideoService', () => {
  let service: AudioVideoService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AudioVideoService],
    }).compile()

    service = module.get<AudioVideoService>(AudioVideoService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
