/**
 * @module auth.controller
 *
 * **Purpose:** HTTP endpoints for registration, login, refresh, logout, and OAuth redirects.
 *
 * **Responsibilities:** Exchange DTOs for tokens; set/clear HTTP-only cookies where used; delegate OAuth callbacks to `AuthService`.
 *
 * **Integration notes:** OAuth flows depend on session middleware and callback URLs configured per provider.
 */

import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards,
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { ConfigService } from '@nestjs/config';
  import type { Response } from 'express';
  import { AuthService } from './auth.service';
  import { RegisterDto } from './dto/register.dto';
  import { LoginDto } from './dto/login.dto';
  import { RefreshTokenGuard } from './guards/refresh-token.guard';
  import { CurrentUser } from './decorators/current-user.decorator';
  import { User } from '../users/entities/user.entity';
  import { Public } from './decorators/public.decorator';
  import { Throttle } from '@nestjs/throttler';

  @Controller('auth') // Routes: /api/auth/* (global prefix from main.ts)
  export class AuthController {
    constructor(
      private readonly authService: AuthService,
      private readonly configService: ConfigService,
    ) {}
  
    // ─── POST /api/auth/register ───
    @Public()
    @Post('register')
    register(@Body() dto: RegisterDto) {
      return this.authService.register(dto);
    }
  
    // ─── POST /api/auth/login ───
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: LoginDto) {
      return this.authService.login(dto);
    }
  
    // ─── POST /api/auth/refresh ───
    @Public()
    @Post('refresh')
    @UseGuards(RefreshTokenGuard)
    @Throttle({ short: { limit: 5, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    refreshTokens(@Req() req: any) {
      const { userId, refreshToken } = req.user;
      return this.authService.refreshTokens(userId, refreshToken);
    }
  
    // ─── POST /api/auth/logout ───
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@CurrentUser('id') userId: string) {
      return this.authService.logout(userId);
    }
  
    // ─── GET /api/auth/google ───
    @Public()
    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleAuth() {
      // Guard redirects; handler body not reached
    }
  
    // ─── GET /api/auth/google/callback ───
    @Public()
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req: any, @Res() res: Response) {
      const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
      try {
        const result = await this.authService.validateOAuthUser(req.user);
        this.setOAuthCookies(res, result.accessToken, result.refreshToken);
        return res.redirect(`${frontendUrl}/auth/callback`);
      } catch {
        return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed`);
      }
    }
  
    // ─── GET /api/auth/github ───
    @Public()
    @Get('github')
    @UseGuards(AuthGuard('github'))
    githubAuth() {
      // Guard redirects
    }
  
    // ─── GET /api/auth/github/callback ───
    @Public()
    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    async githubCallback(@Req() req: any, @Res() res: Response) {
      const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
      try {
        const result = await this.authService.validateOAuthUser(req.user);
        this.setOAuthCookies(res, result.accessToken, result.refreshToken);
        return res.redirect(`${frontendUrl}/auth/callback`);
      } catch {
        return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed`);
      }
    }
  
    // ─── POST /api/auth/oauth/exchange ───
    // Frontend calls this once to exchange httpOnly cookies for JSON tokens, then clears the cookies
    @Public()
    @Post('oauth/exchange')
    @HttpCode(HttpStatus.OK)
    oauthExchange(@Req() req: any, @Res() res: Response) {
      const accessToken = req.cookies?.['oauth_access_token'];
      const refreshToken = req.cookies?.['oauth_refresh_token'];

      if (!accessToken || !refreshToken) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: 'No OAuth tokens found' });
        return;
      }

      // Clear the short-lived cookies immediately after reading
      res.clearCookie('oauth_access_token', { path: '/api/auth' });
      res.clearCookie('oauth_refresh_token', { path: '/api/auth' });

      res.json({ accessToken, refreshToken });
    }

    // ─── GET /api/auth/me ───
    @Get('me')
    getMe(@CurrentUser() user: User) {
      return user;
    }

    // ─── Private helpers ───

    private setOAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
      const isProduction = this.configService.get('NODE_ENV') === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        path: '/api/auth',
        maxAge: 60_000, // 1 minute — just enough for the frontend to exchange
      };

      res.cookie('oauth_access_token', accessToken, cookieOptions);
      res.cookie('oauth_refresh_token', refreshToken, cookieOptions);
    }
  }