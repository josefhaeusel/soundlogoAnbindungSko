import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { ChordRetrievalAiModule } from './chord_retrieval_ai/chord_retrieval_ai.module'
import { AudioVideoService } from './audio-video/audio-video.service'
import { DownloadController } from './download/download.controller'
import { DownloadService } from './download/download.service'
import { ComputerVisionService } from './computer_vision/computer_vision.service'
import { MusicAiSearchModule } from './music-ai-search/music-ai-search.module'
import { CsrfInjectMiddleware } from './csrf-inject.middleware'

@Module({
  imports: [
    ChordRetrievalAiModule,
    ServeStaticModule.forRoot({
      rootPath: join(
        __dirname,
        '..',
        process.env.NODE_ENV == 'production' ? 'frontend' : '',
      ),
      serveRoot: '/',
    }),
  ],
  controllers: [AppController, DownloadController],
  providers: [
    AppService,
    AudioVideoService,
    DownloadService,
    ComputerVisionService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfInjectMiddleware).forRoutes('*')
  }
}
