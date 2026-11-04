import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StorageUploadFile } from './types/storage-upload-file.type';
import type { StorageUploadResult } from './types/storage-upload-result.type';

const DOWNLOAD_URL_TTL_SECONDS = 300;
const INLINE_PREVIEW_MIME_TYPES = new Set([
  'application/pdf',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly presignClient: S3Client;
  private readonly bucket: string;

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
    const publicEndpoint =
      this.configService.get<string>('STORAGE_PUBLIC_ENDPOINT') ?? endpoint;

    this.bucket = bucket;
    const clientConfig = {
      region,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    this.s3 = new S3Client({ ...clientConfig, endpoint });
    this.presignClient =
      publicEndpoint === endpoint
        ? this.s3
        : new S3Client({ ...clientConfig, endpoint: publicEndpoint });
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
    const key = `${folder}/${randomUUID()}-${safeName}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return { key };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async createDownloadUrl(
    key: string,
    fileName: string,
    mimeType: string,
  ): Promise<{ url: string; expiresAt: string }> {
    const encodedFileName = encodeURIComponent(fileName).replace(
      /['()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
    const disposition = INLINE_PREVIEW_MIME_TYPES.has(mimeType)
      ? 'inline'
      : 'attachment';
    const expiresAt = new Date(
      Date.now() + DOWNLOAD_URL_TTL_SECONDS * 1000,
    ).toISOString();
    const url = await getSignedUrl(
      this.presignClient,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: `${disposition}; filename*=UTF-8''${encodedFileName}`,
        ResponseContentType: mimeType,
        ResponseCacheControl: 'private, no-store',
      }),
      { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
    );

    return { url, expiresAt };
  }
}
