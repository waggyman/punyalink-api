import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { RequestValidationPipe } from '../common/pipes/request-validation.pipe';
import { OtpConfirmDto, OtpEmailResendDto } from './otp.dto';
import { OtpService } from './otp.service';

@Controller('otp')
@UsePipes(RequestValidationPipe)
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('email-confirm')
  confirm(@Body() body: OtpConfirmDto) {
    return this.otpService.confirm(body);
  }

  @Post('email-resend')
  resend(@Body() body: OtpEmailResendDto) {
    return this.otpService.resendEmailOtp(body);
  }
}
