import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, GoogleAuthDto } from "./dto/auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("google")
  @HttpCode(HttpStatus.OK)
  async google(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto);
  }

  @Post("refresh")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: any) {
    const tokens = await this.authService.refresh(req.user.id);
    return { user: req.user, ...tokens };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout() {
    return this.authService.logout();
  }
}
