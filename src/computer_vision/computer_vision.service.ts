import { Injectable, Logger } from '@nestjs/common'
import { spawn } from 'child_process'
import * as path from 'path'

@Injectable()
export class ComputerVisionService {
  private readonly logger = new Logger(ComputerVisionService.name)

  analyzeVideo(videoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const rootPath =
        process.env.NODE_ENV == 'production'
          ? __dirname
          : path.join(process.cwd(), 'src', 'computer_vision')
      const pythonFile =
        'computer_vision_child_process.' +
        (process.env.NODE_ENV == 'production' ? 'pyc' : 'py')
      const pythonPath = path.join(rootPath, 'py', pythonFile)
      this.logger.debug(`python3 ${pythonPath} ${videoPath}`)
      this.logger.debug(`env ${process.env.NODE_ENV}`)
      this.logger.debug(`env ${process.env.NUMBA_CACHE_DIR}`)
      this.logger.debug(`env ${process.env.MPLCONFIGDIR}`)
      this.logger.debug(`env ${process.env.PYTHONWARNINGS}`)

      const pythonProcess = spawn('python3', [pythonPath, videoPath], {
        env: process.env,
      })

      pythonProcess.stdout.on('data', (data) => {
        try {
          this.logger.debug(data.toString())
          const result = JSON.parse(data.toString())
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      pythonProcess.on('error', (error) => {
        this.logger.error('error:', error)
        console.error(`error: ${error.message}`)
        reject(error)
      })
    })
  }
}
