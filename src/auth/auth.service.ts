import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { getConfig } from '../config/configuration';

interface TokenPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await this.usersService.hashPassword(dto.password);
    const user = await this.usersService.create({
      ...dto,
      passwordHash,
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.usersService.validatePassword(user, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return tokens;
  }

  async logout() {
    return { success: true };
  }

  private parseTtl(ttl: string): number {
    if (ttl.includes('m')) {
      return parseInt(ttl) * 60;
    }
    if (ttl.includes('h')) {
      return parseInt(ttl) * 3600;
    }
    return parseInt(ttl);
  }

  private async generateTokens(userId: string, email: string) {
    const config = getConfig();
    const payload: TokenPayload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: config.jwt.secret,
      expiresIn: this.parseTtl(config.jwt.accessTtl),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: config.jwt.secret,
      expiresIn: this.parseTtl(config.jwt.refreshTtl),
    });

    return { accessToken, refreshToken };
  }
}
