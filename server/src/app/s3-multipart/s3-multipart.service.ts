import {
  S3Client,
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  PutObjectCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class S3MultipartService {
  private readonly s3Client: S3Client;
  private readonly expiresIn = 900;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_KEY,
        secretAccessKey: process.env.AWS_SECRET,
      },
    });
  }
  initializeMultiPart({ type, metadata, filename }) {
    if (typeof filename !== 'string') {
      throw new HttpException(
        's3: content filename must be a string',
        HttpStatus.BAD_REQUEST
      );
    }
    if (typeof type !== 'string') {
      throw new HttpException(
        's3: content type must be a string',
        HttpStatus.BAD_REQUEST
      );
    }
    const Key = `${crypto.randomUUID()}-${filename}`;

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key,
      ContentType: type,
      Metadata: metadata,
    };

    const command = new CreateMultipartUploadCommand(params);

    return this.s3Client.send(command, (err, data) => {
      if (err) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
      }
      return {
        key: data.Key,
        uploadId: data.UploadId,
      };
    });
  }

  async getSignedUrlForUpload(filename: string, contentType: string) {
    const Key = `${randomUUID()}-${filename}`;
    const url = await getSignedUrl(
      this.s3Client,
      new PutObjectCommand({
        Bucket: this.configService.get('AWS_BUCKET'),
        Key,
        ContentType: contentType,
      }),
      { expiresIn: this.expiresIn }
    );

    return { url, method: 'PUT' };
  }

  async createMultipartUpload(type: string, metadata: any, filename: string) {
    const Key = `${randomUUID()}-${filename}`;
    const command = new CreateMultipartUploadCommand({
      Bucket: this.configService.get('AWS_BUCKET'),
      Key,
      ContentType: type,
      Metadata: metadata,
    });

    const response = await this.s3Client.send(command);
    return {
      key: response.Key,
      uploadId: response.UploadId,
    };
  }

  async getSignedUrlForPart(key: string, uploadId: string, partNumber: number) {
    const url = await getSignedUrl(
      this.s3Client,
      new UploadPartCommand({
        Bucket: this.configService.get('AWS_BUCKET'),
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: '',
      }),
      { expiresIn: this.expiresIn }
    );

    return { url, expires: this.expiresIn };
  }

  async listParts(key: string, uploadId: string) {
    const parts = [];
    let isTruncated = true;
    let partNumberMarker: string;

    while (isTruncated) {
      const response = await this.s3Client.send(
        new ListPartsCommand({
          Bucket: this.configService.get('AWS_BUCKET'),
          Key: key,
          UploadId: uploadId,
          PartNumberMarker: partNumberMarker,
        })
      );

      parts.push(...(response.Parts || []));
      isTruncated = response.IsTruncated || false;
      partNumberMarker = response.NextPartNumberMarker;
    }

    return parts;
  }

  async completeMultipartUpload(key: string, uploadId: string, parts: any[]) {
    const response = await this.s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.configService.get('AWS_BUCKET'),
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      })
    );

    return { location: response.Location };
  }

  async abortMultipartUpload(key: string, uploadId: string) {
    await this.s3Client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.configService.get('AWS_BUCKET'),
        Key: key,
        UploadId: uploadId,
      })
    );

    return {};
  }
}
