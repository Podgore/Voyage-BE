import { config } from 'dotenv';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants';
import * as hashUtil from './utils/hash.util';

type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

type CreateUserArgs = {
  data: {
    name: string;
    email: string;
    passwordHash: string;
  };
};

const mockPrismaService = {
  user: {
    findUnique: jest.fn() as jest.Mock<
      Promise<Partial<User> | null>,
      [unknown]
    >,
    create: jest.fn() as jest.Mock<Promise<User>, [CreateUserArgs]>,
  },
};

const mockJwtService = {
  sign: jest.fn() as jest.Mock<string, [unknown]>,
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: typeof mockPrismaService;

  beforeAll(() => {
    config({ path: '.env.test' });

    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET || 'test-access-secret';
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRES_IN =
      process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    process.env.JWT_REFRESH_EXPIRES_IN =
      process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto = {
      name: 'Test User',
      email: 'test@voyage.com',
      password: 'password123',
    };

    it('throws ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: randomUUID() });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      await expect(service.register(dto)).rejects.toThrow(
        ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
      );
    });

    it('creates a user with a hashed password and returns safe fields', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const createdUser: User = {
        id: randomUUID(),
        name: dto.name,
        email: dto.email,
        passwordHash: 'hashed-value',
        createdAt: new Date(),
      };
      prisma.user.create.mockResolvedValue(createdUser);

      const result = await service.register(dto);

      expect(prisma.user.create).toHaveBeenCalledTimes(1);

      const createMock = prisma.user.create;
      const createArgs = createMock.mock.calls[0][0];

      expect(createArgs.data.name).toBe(dto.name);
      expect(createArgs.data.email).toBe(dto.email);
      expect(typeof createArgs.data.passwordHash).toBe('string');
      expect(createArgs.data.passwordHash).not.toBe(dto.password);

      expect(result).toEqual({
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
      });
    });
  });

  describe('login', () => {
    const dto = {
      email: 'test@voyage.com',
      password: 'password123',
    };

    it('returns access and refresh tokens for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: randomUUID(),
        email: dto.email,
        passwordHash: 'hashed-value',
      });
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      await expect(service.login(dto)).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('returns a generic 401 when the email does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
      );
    });

    it('returns the same generic 401 when the password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: randomUUID(),
        email: dto.email,
        passwordHash: 'hashed-value',
      });
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
      );
    });
  });
});
