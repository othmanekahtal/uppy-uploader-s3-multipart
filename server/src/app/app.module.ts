import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { S3MultipartModule } from './s3-multipart/s3-multipart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    S3MultipartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
