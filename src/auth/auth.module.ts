import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";
import { getConfig } from "../config/configuration";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const config = getConfig();
        const ttl = config.jwt.accessTtl;
        const seconds = ttl.includes("m")
          ? parseInt(ttl) * 60
          : ttl.includes("h")
            ? parseInt(ttl) * 3600
            : parseInt(ttl);
        return {
          secret: config.jwt.secret,
          signOptions: {
            expiresIn: seconds,
          },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
