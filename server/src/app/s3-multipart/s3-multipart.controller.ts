import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { S3MultipartService } from './s3-multipart.service';

@Controller('s3')
export class S3MultipartController {
  constructor(private readonly s3MultipartService: S3MultipartService) {}

  @Post('sign')
  async getSignedUrl(
    @Body('filename') filename: string,
    @Body('contentType') contentType: string
  ) {
    if (!filename || !contentType) {
      throw new BadRequestException('Filename and contentType are required');
    }
    return this.s3MultipartService.getSignedUrlForUpload(filename, contentType);
  }

  @Post('multipart')
  async createMultipartUpload(
    @Body('type') type: string,
    @Body('metadata') metadata: any,
    @Body('filename') filename: string
  ) {
    if (!filename || !type) {
      throw new BadRequestException('Filename and type are required');
    }
    return this.s3MultipartService.createMultipartUpload(
      type,
      metadata,
      filename
    );
  }

  @Get('multipart/:uploadId/:partNumber')
  async getSignedUrlForPart(
    @Param('uploadId') uploadId: string,
    @Param('partNumber') partNumber: string,
    @Query('key') key: string
  ) {
    if (!key) {
      throw new BadRequestException('Key is required as a query parameter');
    }
    const partNum = Number(partNumber);
    if (!Number.isInteger(partNum) || partNum < 1 || partNum > 10000) {
      throw new BadRequestException(
        'Part number must be an integer between 1 and 10000'
      );
    }
    return this.s3MultipartService.getSignedUrlForPart(key, uploadId, partNum);
  }

  @Get('multipart/:uploadId')
  async listParts(
    @Param('uploadId') uploadId: string,
    @Query('key') key: string
  ) {
    if (!key) {
      throw new BadRequestException('Key is required as a query parameter');
    }
    return this.s3MultipartService.listParts(key, uploadId);
  }

  @Post('multipart/:uploadId/complete')
  async completeMultipartUpload(
    @Param('uploadId') uploadId: string,
    @Query('key') key: string,
    @Body('parts') parts: any[]
  ) {
    if (!key) {
      throw new BadRequestException('Key is required as a query parameter');
    }
    if (!Array.isArray(parts) || !parts.every(this.isValidPart)) {
      throw new BadRequestException(
        'Parts must be an array of {ETag, PartNumber} objects'
      );
    }
    return this.s3MultipartService.completeMultipartUpload(
      key,
      uploadId,
      parts
    );
  }

  @Delete('multipart/:uploadId')
  async abortMultipartUpload(
    @Param('uploadId') uploadId: string,
    @Query('key') key: string
  ) {
    if (!key) {
      throw new BadRequestException('Key is required as a query parameter');
    }
    return this.s3MultipartService.abortMultipartUpload(key, uploadId);
  }

  private isValidPart(part: any): boolean {
    return (
      part &&
      typeof part === 'object' &&
      Number(part.PartNumber) &&
      typeof part.ETag === 'string'
    );
  }
}
