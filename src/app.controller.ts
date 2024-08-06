import { Controller, Get, Res } from '@nestjs/common'
import { AppService } from './app.service'
import { Response } from 'express'
import { join } from 'path'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  loadFrontend(@Res() res: Response): void {
    res.sendFile(join(
        __dirname,
        '..',
        process.env.NODE_ENV == 'production' ? 'frontend' : '',
        'index.html'
      ),
    )
  }
}

  

