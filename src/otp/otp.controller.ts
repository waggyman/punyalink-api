import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { RequestValidationPipe } from '../common/pipes/request-validation.pipe';
import {
  OtpConfirmDto,
  OtpEmailResendDto,
  OtpPasswordResetConfirmDto,
} from './otp.dto';
import { OtpService } from './otp.service';

@Controller('otp')
@UsePipes(RequestValidationPipe)
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('email-confirm')
  confirm(@Body() body: OtpConfirmDto) {
    return this.otpService.confirmRegistration(body);
  }

  @Post('password-reset-confirm')
  confirmPasswordReset(@Body() body: OtpPasswordResetConfirmDto) {
    return this.otpService.confirmPasswordReset(body);
  }

  @Post('password-reset-resend')
  resendPasswordReset(@Body() body: OtpEmailResendDto) {
    return this.otpService.resendPasswordResetOtp(body.target);
  }

  @Post('email-resend')
  resend(@Body() body: OtpEmailResendDto) {
    return this.otpService.resendEmailOtp(body);
  }
}
