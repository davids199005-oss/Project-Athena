/**
 * @module env.validation
 *
 * **Purpose:** Fail-fast validation of required environment variables at `ConfigModule` bootstrap.
 *
 * **Responsibilities:** Define typed `EnvironmentVariables`; run `class-validator` synchronously; throw aggregated errors.
 *
 * **Integration notes:** `enableImplicitConversion` maps numeric strings—invalid formats still fail validation. Secrets must be provided in every environment.
 */

import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  // ─── Runtime ───

  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  // ─── Server ───

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  FRONTEND_URL!: string;

  // ─── Database ───

  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT!: number;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME!: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  // ─── JWT ───

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRATION!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRATION!: string;

  // ─── OAuth: Google ───

  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_ID!: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_CALLBACK_URL!: string;

  // ─── OAuth: GitHub ───

  @IsString()
  @IsNotEmpty()
  GITHUB_CLIENT_ID!: string;

  @IsString()
  @IsNotEmpty()
  GITHUB_CLIENT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  GITHUB_CALLBACK_URL!: string;

  // ─── OpenAI ───

  @IsString()
  @IsNotEmpty()
  OPENAI_API_KEY!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors
      .map((err) => {
        const constraints = Object.values(err.constraints || {}).join(', ');
        return `  - ${err.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(
      `\n❌ Environment validation failed:\n${formattedErrors}\n`,
    );
  }

  return validatedConfig;
}
