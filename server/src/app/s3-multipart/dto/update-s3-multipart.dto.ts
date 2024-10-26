import { PartialType } from '@nestjs/mapped-types';
import { CreateS3MultipartDto } from './create-s3-multipart.dto';

export class UpdateS3MultipartDto extends PartialType(CreateS3MultipartDto) {}
