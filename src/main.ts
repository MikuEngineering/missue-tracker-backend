import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

import * as session from 'express-session';
import * as passport from 'passport';

const { SESSION_SECRET, PORT } = process.env;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Add middlewares to the express server
  app.use(
    session({
      secret: SESSION_SECRET || 'nest secret',
      resave: false,
      saveUninitialized: false
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({
    origin: 'http://localhost:8080',
  })

  await app.listen(Number(PORT) || 3000);
}
bootstrap();
