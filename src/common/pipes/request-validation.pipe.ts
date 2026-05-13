import {
  BadRequestException,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';

@Injectable()
export class RequestValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );
        return new BadRequestException(
          messages.length ? messages : 'Invalid request payload',
        );
      },
    });
  }
}
