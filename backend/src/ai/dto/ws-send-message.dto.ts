import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class WsSendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}
