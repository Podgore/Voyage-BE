import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: `${number}${'s' | 'm' | 'h' | 'd'}`;
  private readonly refreshExpiresIn: `${number}${'s' | 'm' | 'h' | 'd'}`;

  constructor(private jwtService: JwtService) {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN;
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN;

    if (
      !accessSecret ||
      !refreshSecret ||
      !accessExpiresIn ||
      !refreshExpiresIn
    ) {
      throw new Error('JWT environment variables are not fully defined');
    }

    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
    this.accessExpiresIn =
      accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`;
    this.refreshExpiresIn =
      refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`;
  }

  generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }
}
