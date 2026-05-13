import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @IsString({ message: 'password must be a string' })
  @MinLength(6, { message: 'password must be at least 6 characters' })
  @IsNotEmpty({ message: 'password is required' })
  password: string;
}

export class AdminRefreshDto {
  @IsString({ message: 'refreshToken must be a string' })
  @IsNotEmpty({ message: 'refreshToken is required' })
  refreshToken: string;
}
