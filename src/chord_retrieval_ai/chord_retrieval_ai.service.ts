// src/chord-retrieval-ai/chord-retrieval-ai.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { spawn } from 'child_process'
import * as path from 'path'
import { join } from 'path'

@Injectable()
export class ChordRetrievalAiService {
  private readonly logger = new Logger(ChordRetrievalAiService.name)

  analyzeSong(songPath: string, animationAppended: boolean, animationStart: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const rootPath =
        process.env.NODE_ENV == 'production'
          ? __dirname
          : path.join(process.cwd(), 'src', 'chord_retrieval_ai')
      const pythonFile =
        'keyfinderChildProcess.' +
        (process.env.NODE_ENV == 'production' ? 'pyc' : 'py')
      const pythonPath = path.join(rootPath, 'py', pythonFile)
      this.logger.debug(
        `python3 ${pythonPath} ${songPath} ${animationAppended} ${animationStart}`,
      )
      this.logger.debug(`env ${process.env.NODE_ENV}`)
      this.logger.debug(`env ${process.env.NUMBA_CACHE_DIR}`)
      this.logger.debug(`env ${process.env.MPLCONFIGDIR}`)
      this.logger.debug(`env ${process.env.PYTHONWARNINGS}`)

      const pythonProcess = spawn(
        'python3',
        [pythonPath, songPath, animationAppended.toString(), animationStart.toString()],
        { env: process.env },
      )

      pythonProcess.stdout.on('data', (data) => {
        try {
          const result = JSON.parse(data.toString())
          resolve(result)
        } catch (error) {
          this.logger.error('error:', error)
          console.error(`error: ${error.message}`)
          reject(error)
        }
      })

      pythonProcess.stderr.on('data', (data) => {
        this.logger.warn('stderr:', data)
        console.error(`stderr: ${data}`)
      })

      pythonProcess.on('error', (error) => {
        this.logger.error('error:', error)
        console.error(`error: ${error.message}`)
        reject(error)
      })
    })
  }
}
