import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('StorageService', () => {
  const getSignedUrlMock = jest.mocked(getSignedUrl);
  const configValues: Record<string, string> = {
    STORAGE_ENDPOINT: 'http://minio:9000',
    STORAGE_PUBLIC_ENDPOINT: 'http://localhost:9000',
    STORAGE_ACCESS_KEY: 'access-key',
    STORAGE_SECRET_KEY: 'secret-key',
    STORAGE_REGION: 'us-east-1',
    STORAGE_BUCKET: 'voyage-files',
  };
  let service: StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    getSignedUrlMock.mockResolvedValue('https://minio.local/signed-object');
    const configService = {
      get: jest.fn((key: string) => configValues[key]),
    } as unknown as ConfigService;
    service = new StorageService(configService);
  });

  it('creates a short-lived inline URL for supported previews', async () => {
    const startedAt = Date.now();
    const result = await service.createDownloadUrl(
      'notes/note-1/file.pdf',
      'annual report (final).pdf',
      'application/pdf',
    );

    expect(result.url).toBe('https://minio.local/signed-object');
    expect(Date.parse(result.expiresAt)).toBeGreaterThanOrEqual(
      startedAt + 299_000,
    );
    expect(Date.parse(result.expiresAt)).toBeLessThanOrEqual(
      Date.now() + 300_000,
    );
    expect(getSignedUrlMock).toHaveBeenCalledTimes(1);
  });
});
