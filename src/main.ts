import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as session from 'express-session'
import { Logger } from '@nestjs/common'
import helmet from 'helmet'
import { nestCsrf, CsrfFilter } from 'ncsrf'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const logger = new Logger('bootstrap')
  logger.debug(`NODE_ENV: ${process?.env?.NODE_ENV}`)

  // security -csp
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'script-src': [
            `'self'`,
            `https: 'unsafe-eval'`,
            `unpkg.com`,
            `cdnjs.cloudflare.com`,
            `vjs.zencdn.net`,
          ],
          'worker-src': [`blob:`],
          'connect-src': [`'self'`, `blob:`],
          // 'require-trusted-types-for': [`'script'`],
        },
      },
    }),
  )

  // security - csrf
  app.use(cookieParser())
  app.use(nestCsrf())

  // session
  app.use(
    session({
      secret: 'y0ur_53cr37_k3y', // TODO: 2024-07-11, Use a secure secret in production
      resave: false,
      saveUninitialized: false,
      // cookie: { secure: true }, // TODO: 2024-07-11, https proxy needed
    }),
  )

  // start
  await app.listen(3000)
}
bootstrap()
