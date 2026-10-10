import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type StorageUploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

export type StorageUploadResult = {
  key: string;
  url: string;
};

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint =
      this.configService.get<string>('STORAGE_ENDPOINT') ??
      'http://localhost:9000';
    const accessKeyId =
      this.configService.get<string>('STORAGE_ACCESS_KEY') ?? 'minioadmin';
    const secretAccessKey =
      this.configService.get<string>('STORAGE_SECRET_KEY') ?? 'minioadmin';
    const region =
      this.configService.get<string>('STORAGE_REGION') ?? 'us-east-1';
    const bucket =
      this.configService.get<string>('STORAGE_BUCKET') ?? 'voyage-files';

    this.bucket = bucket;
    this.publicUrl =
      this.configService.get<string>('STORAGE_PUBLIC_URL') ??
      'http://localhost:9000/voyage-files';

    this.s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async ensureBucket(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async uploadFile(
    file: StorageUploadFile,
    folder: string,
  ): Promise<StorageUploadResult> {
    await this.ensureBucket();

    const safeName = file.originalname.replace(/\s+/g, '-');
    const key = `${folder}/${Date.now()}-${safeName}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      key,
      url: `${this.publicUrl}/${key}`,
    };
  }
}
