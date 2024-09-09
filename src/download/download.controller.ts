import {
  Controller,
  Get,
  Logger,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common'
import { DownloadService } from './download.service'
import { Request, Response } from 'express'
import { Csrf } from 'ncsrf'
import { ISession } from '../chord_retrieval_ai/chord_retrieval_ai.controller'
import * as path from 'node:path'

@Controller('download')
export class DownloadController {
  private readonly logger = new Logger(DownloadController.name)

  constructor(private readonly downloadService: DownloadService) {}

  @Get('streamable')
  @Csrf()
  async streamable(
    @Query('file') file: string,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const uploadPrefix = (request.session as ISession).uploadPrefix
    const downloadFile = path.join(uploadPrefix, file)
    this.logger.debug(downloadFile)

    const fileStream = this.downloadService.getFileStream(downloadFile)
    const fileType = this.downloadService.getFileType(downloadFile)
    const fileSize = this.downloadService.getFileSize(downloadFile)

    this.logger.debug(fileType)
    this.logger.debug(fileSize)

    return new StreamableFile(fileStream, {
      type: fileType,
      disposition: `attachment; filename="${file}"`,
      length: fileSize,
    }) // Supports Buffer and Stream
  }
}
