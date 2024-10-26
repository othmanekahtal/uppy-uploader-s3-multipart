import { Module } from '@nestjs/common';
import { S3MultipartService } from './s3-multipart.service';
import { S3MultipartController } from './s3-multipart.controller';

@Module({
  controllers: [S3MultipartController],
  providers: [S3MultipartService],
})
export class S3MultipartModule {}
