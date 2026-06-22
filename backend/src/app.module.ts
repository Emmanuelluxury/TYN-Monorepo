import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema } from './config/env.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';
import { uploadConfig } from './config/upload.config';
import { databaseConfig } from './config/database.config';
import { gameConfig } from './config/game.config';
import { jwtConfig } from './config/jwt.config';
import { redisConfig } from './config/redis.config';
import { nearConfig } from './config/near.config';
import { CommonModule, HttpExceptionFilter, AppThrottlerGuard } from './common';
import { SuspensionCheckMiddleware } from './common/middleware/suspension-check.middleware';
import { User } from './modules/users/entities/user.entity';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { ChanceModule } from './modules/chance/chance.module';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { RequestLoggerInterceptor } from './common/interceptors/request-logger.interceptor';
import { HealthController } from './health/health.controller';
import { PropertiesModule } from './modules/properties/properties.module';
import { CommunityChestModule } from './modules/community-chest/community-chest.module';
import { GamesModule } from './modules/games/games.module';
import { EmailModule } from './modules/email/email.module';
import { NearModule } from './modules/near/near.module';
import { LedgerReconciliationModule } from './modules/ledger-reconciliation/ledger-reconciliation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        gameConfig,
        jwtConfig,
        redisConfig,
        uploadConfig,
        nearConfig,
      ],
      envFilePath: '.env',
      validationSchema,
      validationOptions: { abortEarly: false },
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database') as Record<
          string,
          unknown
        >;
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }
        return dbConfig;
      },
    }),

    TypeOrmModule.forFeature([User]),

    RedisModule,
    CommonModule,
    UsersModule,
    AuthModule,
    PropertiesModule,
    ChanceModule,
    CommunityChestModule,
    GamesModule,
    EmailModule,
    LedgerReconciliationModule,
    NearModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    SuspensionCheckMiddleware,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SuspensionCheckMiddleware).forRoutes('*');
  }
}
