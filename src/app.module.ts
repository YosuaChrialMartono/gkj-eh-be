import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { getConfig } from "./config/configuration";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ContentModule } from "./content/content.module";
import { PelayanModule } from "./pelayan/pelayan.module";
import { ReportsModule } from "./reports/reports.module";
import { MembersModule } from "./members/members.module";
import { User } from "./users/entities/user.entity";
import { Content } from "./content/entities/content.entity";
import { PelayanRole } from "./pelayan/entities/pelayan-role.entity";
import { PelayanPerson } from "./pelayan/entities/pelayan-person.entity";
import { PelayanServiceEntity } from "./pelayan/entities/pelayan-service.entity";
import { PelayanAssignment } from "./pelayan/entities/pelayan-assignment.entity";
import { Report } from "./reports/entities/report.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const config = getConfig();
        return {
          type: "postgres",
          host: config.database.host,
          port: config.database.port,
          username: config.database.username,
          password: config.database.password,
          database: config.database.name,
          entities: [
            User,
            Content,
            PelayanRole,
            PelayanPerson,
            PelayanServiceEntity,
            PelayanAssignment,
            Report,
          ],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    ContentModule,
    PelayanModule,
    ReportsModule,
    MembersModule,
  ],
})
export class AppModule {}
