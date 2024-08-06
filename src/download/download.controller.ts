import {
  Controller,
  Get,
  Logger,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common'
import { DownloadService } from './download.service'
import { Response } from 'express'
import { Csrf } from 'ncsrf'

@Controller('download')
export class DownloadController {
  private readonly logger = new Logger(DownloadController.name)

  constructor(private readonly downloadService: DownloadService) {}

  @Get('streamable')
  @Csrf()
  async streamable(
    @Query('file') file: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const fileStream = this.downloadService.getFileStream(file)
    const fileType = this.downloadService.getFileType(file)
    const fileSize = this.downloadService.getFileSize(file)

    this.logger.debug(fileType)
    this.logger.debug(fileSize)

    return new StreamableFile(fileStream, {
      type: fileType,
      disposition: `attachment; filename="${file}"`,
      length: fileSize,
    }) // Supports Buffer and Stream
  }
}
