import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
  Get,
  Logger,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ChordRetrievalAiService } from './chord_retrieval_ai.service'
import { Response, Request } from 'express'
import { Session } from 'express-session'
import * as fs from 'fs'
import * as path from 'path'
import { AudioVideoService } from '../audio-video/audio-video.service'
import { ComputerVisionService } from '../computer_vision/computer_vision.service'
import { Csrf } from 'ncsrf'
import { nanoid } from 'nanoid'

export interface ISession extends Session {
  tempOriginalVideoFilePath?: string
  appendedAnimation?: boolean
  convertedVideo?: boolean
  uploadPrefix?: string
}

@Controller('chord-retrieval-ai')
export class ChordRetrievalAiController {
  private readonly logger = new Logger(ChordRetrievalAiController.name)

  constructor(
    private readonly chordRetrievalAiService: ChordRetrievalAiService,
    private readonly audioVideoService: AudioVideoService,
    private readonly computerVisionService: ComputerVisionService,
  ) {
    const baseDir = path.join(__dirname, '../../temp_uploads')
    const videoDir = path.join(baseDir, 'video')
    const audioDir = path.join(baseDir, 'audio')
    const tmpDir = path.join(baseDir, 'tmp')

    this.ensureDirectoryExists(videoDir)
    this.ensureDirectoryExists(audioDir)
    this.ensureDirectoryExists(tmpDir)
  }

  private ensureDirectoryExists(dirPath: string): void {
    this.logger.log(`Check dir: ${dirPath}`)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  @Get('progress')
  // @Csrf() TODO: 2024-07-11, eventsource can't use custom headers - soundlogo.js
  progress(@Req() request: Request, @Res() response: Response) {
    response.setHeader('Content-Type', 'text/event-stream')
    response.setHeader('Cache-Control', 'no-cache')
    response.setHeader('X-Accel-Buffering', 'no')

    const sendProgress = (message: string) => {
      this.logger.log(`Progress: ${message}`)
      response.write(`data: ${JSON.stringify({ message })}\n\n`)
    }

    request.on('close', () => {
      this.logger.log('Client connection closed')
      response.end()
    })

    request.app.set('sendProgress', sendProgress)
  }

  @Post('uploadVideo')
  @Csrf()
  @UseInterceptors(FileInterceptor('file'))
  async videoHandler(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    // send progress
    let progress = ''
    const sendProgress = request.app.get('sendProgress')

    const uploadPrefix = nanoid(6)

    ;(request.session as ISession).uploadPrefix = uploadPrefix

    const analysisResult = {
      audioAnalysis: {},
      videoAnalysis: { convertedVideo: null },
      videoOutputFile: null,
      csrfToken: null,
    }
    let audioAnalysisResult
    let videoAnalysisResult
    let tempAudioFilePath = null

    try {
      this.logger.log(`Starting video upload handling: ${uploadPrefix}`)

      const sizeMegabyte = file.size / 1024 / 1024
      const commonFilesize = () => {
        this.logger.log('Checking Filesize', `${sizeMegabyte}MB`)
        return sizeMegabyte <= 100
      }
      if (!commonFilesize()){
        throw new Error('InvalidFilesize')
      }

      const tempBaseVideoPath = path.join(
        __dirname,
        '../../temp_uploads/video',
        uploadPrefix,
      )
      if (!fs.existsSync(tempBaseVideoPath)) {
        fs.mkdirSync(tempBaseVideoPath, { recursive: true })
      }

      const tempBaseAudioPath = path.join(
        __dirname,
        '../../temp_uploads/audio',
        uploadPrefix,
      )
      if (!fs.existsSync(tempBaseAudioPath)) {
        fs.mkdirSync(tempBaseAudioPath, { recursive: true })
      }

      const tempOriginalVideoFilePath = path.join(
        tempBaseVideoPath,
        file.originalname,
      )

      let tempVideoOutputFilePath

      this.logger.log(tempOriginalVideoFilePath)
      await fs.writeFileSync(tempOriginalVideoFilePath, file.buffer)

      // send progress
      progress = 'Retrieving Video Data...'
      this.logger.log(`send progress: ${progress}`)
      sendProgress(progress)

      // get video data
      const videoData = await this.audioVideoService.getVideoData(
        tempOriginalVideoFilePath,
      )
      this.logger.debug(videoData)

      switch (true) {
        case videoData.supported_length === false:
          throw new Error('LengthNotSupported')
        case videoData.supported_resolution === false &&
          videoData.supported_ratio === false:
          throw new Error('ResolutionAndRatioNotSupported')
        case videoData.supported_resolution === false &&
          videoData.supported_ratio === true:
          throw new Error('ResolutionNotSupported')
        case videoData.supported_resolution === true &&
          videoData.supported_ratio === false:
          throw new Error('RatioNotSupported')
      }

      if (
        (videoData.codec_name != 'h264' && videoData.codec_name != 'h265') ||
        !tempOriginalVideoFilePath.endsWith('.mp4')
      ) {
        /* 2024-08-13, RP
        this.logger.log('Converting Video Format...')
        sendProgress('Converting Video Format...')
        tempVideoOutputFilePath = await this.audioVideoService.convert(
          tempOriginalVideoFilePath,
        )
        */
        // tempVideoOutputFilePath = tempOriginalVideoFilePath
        ;(request.session as ISession).convertedVideo = true
      } else {
        // tempVideoOutputFilePath = tempOriginalVideoFilePath
        ;(request.session as ISession).convertedVideo = false
      }

      // send progress
      progress = 'Splitting Audio from Video...'
      this.logger.log(`send progress: ${progress}`)
      sendProgress(progress)

      // split audio and video
      try {
        const splitFiles = await this.audioVideoService.split(
          tempOriginalVideoFilePath, 
          (request.session as ISession).convertedVideo
        )
        tempVideoOutputFilePath = splitFiles.video
        tempAudioFilePath = splitFiles.audio
      } catch (error) {
        this.logger.error('Error during audio/video splitting', error.stack)
      }

      // send progress
      progress = 'Detecting T-Outro Animation...'
      this.logger.log(`send progress: ${progress}`)
      sendProgress(progress)

      // analyse video
      videoAnalysisResult = await this.computerVisionService.analyzeVideo(
        tempVideoOutputFilePath,
      )
      videoAnalysisResult.inputVideoData = videoData

      this.logger.debug(videoAnalysisResult)

      // send progress
      progress = 'Retrieving Key and Loudness...'
      this.logger.log(`send progress: ${progress}`)
      sendProgress(progress)

      // analyse song
      if (tempAudioFilePath != null) {
        audioAnalysisResult = await this.chordRetrievalAiService.analyzeSong(
          tempAudioFilePath,
          videoAnalysisResult.appendAnimation,
          videoAnalysisResult.analysis.logo_start,
        )
      } else {
        audioAnalysisResult = await this.chordRetrievalAiService.analyzeSong(
          tempOriginalVideoFilePath,
          videoAnalysisResult.appendAnimation,
          videoAnalysisResult.analysis.logo_start,
        )
      }

      if (videoAnalysisResult.appendAnimation == true) {
        // send progress
        progress = 'Appending T-Outro Animation...'
        this.logger.log(`send progress: ${progress}`)
        sendProgress(progress)

        // append animation
        try{
          tempVideoOutputFilePath = await this.audioVideoService.appendAnimation(
            tempVideoOutputFilePath,
            videoData,
            // //2024-08-19 JH true,  
        )} catch (error) {
          this.logger.error("Error during appending", error.stack)
        }
      }

      analysisResult.audioAnalysis = audioAnalysisResult
      analysisResult.videoAnalysis = videoAnalysisResult
      analysisResult.videoOutputFile = tempVideoOutputFilePath
      analysisResult.videoAnalysis.convertedVideo = (
        request.session as ISession
      ).convertedVideo
      ;(request.session as ISession).tempOriginalVideoFilePath =
        tempOriginalVideoFilePath
      ;(request.session as ISession).appendedAnimation =
        videoAnalysisResult.appendAnimation

      // 2024-08-13, csrf
      analysisResult.csrfToken = (request as any).csrfToken()

      sendProgress('Done (on server-side).')
      this.logger.log('Processing done')
      this.logger.log(analysisResult)
      response.json(analysisResult)

      // delete split audio
      fs.unlinkSync(tempAudioFilePath)
      this.logger.warn(`Deleted ${tempAudioFilePath}`)
    } catch (error) {

      this.logger.warn('Error during video handling', error.stack)
      if (error.message === 'InvalidFilesize') {
        response.status(400).json({ error: 'Invalid Filesize.' })
      } else if (error.message === 'LengthNotSupported') {
        response.status(400).json({ error: 'Length not supported.' })
      } else if (error.message === 'ResolutionAndRatioNotSupported') {
        response.status(400).json({ error: 'Resolution and display ratio not supported.' })
      } else if (error.message === 'ResolutionNotSupported') {
        response.status(400).json({ error: 'Resolution not supported.' })
      } else if (error.message === 'RatioNotSupported') {
        response.status(400).json({ error: 'Display ratio not supported.' })
      } else {
        response.status(500).json({ error: error.message })
      }
    }
  }

  @Post('uploadRenderedAudio')
  @Csrf()
  @UseInterceptors(FileInterceptor('file'))
  async audioHandler(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      this.logger.log(`Starting audio upload handling: ${file.originalname}`)

      const uploadPrefix = (request.session as ISession).uploadPrefix
      const tempAudioFilePath = path.join(
        __dirname,
        '../../temp_uploads/audio',
        uploadPrefix,
        file.originalname,
      )

      fs.writeFileSync(tempAudioFilePath, file.buffer)

      const appendedAnimation = (request.session as ISession).appendedAnimation
      const convertedVideo = (request.session as ISession).convertedVideo
      const tempOriginalVideoFilePath = (request.session as ISession).tempOriginalVideoFilePath

      /*
      const tempVideoFilePath = path.join(
        __dirname,
        '../../temp_uploads/video',
        tempOriginalVideoFilePath,
      )
      */
      const tempVideoFilePath = tempOriginalVideoFilePath

      const renderedResult = await this.audioVideoService.join(
        tempOriginalVideoFilePath,
        tempAudioFilePath,
        true,
        convertedVideo,
        appendedAnimation,
      )

      fs.unlinkSync(tempAudioFilePath)
      this.logger.warn(`Deleted ${tempAudioFilePath}`)

      this.logger.log(
        `Audio ${tempAudioFilePath} and Video ${tempVideoFilePath} joined as ${renderedResult}`,
      )
      response.json({
        renderedResult: renderedResult,
        // 2024-08-13, csrf
        csrfToken: (request as any).csrfToken(),
      })

      /*fs.unlinkSync(tempOriginalVideoFilePath);
      this.logger.warn(`Deleted ${tempOriginalVideoFilePath}`);*/
    } catch (error) {
      this.logger.error('Error during audio handling', error.stack)
      response.status(500).json({ error: error.message })
    }
  }
}
