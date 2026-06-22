import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Throttle } from '@nestjs/throttler';

import { AuthAuditService } from './audit/auth-audit.service';
import * as express from 'express';
import { Req } from '@nestjs/common';

@Controller('admin')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() adminLoginDto: AdminLoginDto,
    @Req() req: express.Request,
  ) {
    const redactedEmail = AuthAuditService.redactEmail(adminLoginDto.email);
    this.logger.log(`Admin login attempt for email: ${redactedEmail}`);

    const ipAddress = req.ip;
    const userAgent = req.headers?.['user-agent'];

    const user = await this.authService.validateAdmin(
      adminLoginDto.email,
      adminLoginDto.password,
      ipAddress,
      userAgent,
    );

    if (!user) {
      this.logger.warn(
        `Failed admin login attempt for email: ${redactedEmail}`,
      );

      throw new UnauthorizedException('Invalid admin credentials');
    }

    this.logger.log(`Successful admin login for email: ${redactedEmail}`);

    return this.authService.login(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        is_admin: user.is_admin,
      },
      ipAddress,
      userAgent,
    );
  }
}
