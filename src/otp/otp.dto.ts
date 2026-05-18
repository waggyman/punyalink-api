import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class OtpConfirmDto {
  @IsEmail({}, { message: 'target must be a valid email address' })
  @IsNotEmpty({ message: 'target is required' })
  target: string;

  @IsString({ message: 'value must be a string' })
  @IsNotEmpty({ message: 'value is required' })
  value: string;

  @IsString({ message: 'password must be a string' })
  @MinLength(6, { message: 'password must be at least 6 characters' })
  @IsNotEmpty({ message: 'password is required' })
  password: string;
}

export class OtpEmailResendDto {
  @IsEmail({}, { message: 'target must be a valid email address' })
  @IsNotEmpty({ message: 'target is required' })
  target: string;
}

export class OtpPasswordResetConfirmDto {
  @IsEmail({}, { message: 'target must be a valid email address' })
  @IsNotEmpty({ message: 'target is required' })
  target: string;

  @IsString({ message: 'value must be a string' })
  @IsNotEmpty({ message: 'value is required' })
  value: string;

  @IsString({ message: 'password must be a string' })
  @MinLength(6, { message: 'password must be at least 6 characters' })
  @IsNotEmpty({ message: 'password is required' })
  password: string;
}
