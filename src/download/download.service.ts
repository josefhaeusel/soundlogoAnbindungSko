import { Injectable, Logger } from '@nestjs/common'
import { createReadStream } from 'fs'
import { join, resolve } from 'path'
import * as mime from 'mime-types'
import { FilesManager } from 'turbodepot-node'

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name)
  private readonly baseDirectory = resolve(process.cwd(), 'temp_uploads')

  public getFileType(filePath: string, type = 'video') {
    return mime.lookup(filePath)
  }

  public getFileSize(filePath: string, type = 'video') {
    const sanitizedPath = this._sanitizePath(filePath)
    const absolutePath = join(this.baseDirectory, type, sanitizedPath)

    const filesManager = new FilesManager()
    return filesManager.getFileSize(absolutePath)
  }

  public getFileStream(filePath: string, type = 'video') {
    const sanitizedPath = this._sanitizePath(filePath)
    const absolutePath = join(this.baseDirectory, type, sanitizedPath)
    return createReadStream(absolutePath)
  }

  private _sanitizePath(filePath: string): string {
    // Example sanitization: remove any leading or trailing slashes and replace backslashes with slashes
    return filePath.replace(/^[/\\]+|[/\\]+$/g, '').replace(/\\/g, '/')
  }
}
