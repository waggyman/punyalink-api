import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  parseOptionalBooleanField,
  type ParsedMultipart,
} from '../common/multipart/parse-multipart.util';
import { CreateLinkDto, UpdateLinkDto } from './links.dto';

async function throwIfInvalid(
  dto: object,
  errors: Awaited<ReturnType<typeof validate>>,
): Promise<void> {
  if (errors.length > 0) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new BadRequestException(
      messages.length ? messages : 'Invalid request payload',
    );
  }
}

export async function validateCreateLinkDto(
  plain: Record<string, unknown>,
): Promise<CreateLinkDto> {
  const dto = plainToInstance(CreateLinkDto, plain, {
    enableImplicitConversion: true,
  });
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  await throwIfInvalid(dto, errors);
  return dto;
}

export async function validateUpdateLinkDto(
  plain: Record<string, unknown>,
): Promise<UpdateLinkDto> {
  const dto = plainToInstance(UpdateLinkDto, plain, {
    enableImplicitConversion: true,
  });
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: false,
  });
  await throwIfInvalid(dto, errors);
  return dto;
}

export function multipartToCreateLinkPlain(
  fields: ParsedMultipart['fields'],
): Record<string, unknown> {
  const isPublic = parseOptionalBooleanField(fields.isPublic);
  const isActive = parseOptionalBooleanField(fields.isActive);
  return {
    name: fields.name,
    externalLink: fields.externalLink,
    ...(fields.accessLink !== undefined && fields.accessLink !== ''
      ? { accessLink: fields.accessLink }
      : {}),
    ...(fields.source !== undefined ? { source: fields.source || null } : {}),
    ...(isPublic !== undefined ? { isPublic } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };
}

export function multipartToUpdateLinkPlain(
  fields: ParsedMultipart['fields'],
): Record<string, unknown> {
  const plain: Record<string, unknown> = {};
  if (fields.name !== undefined && fields.name !== '') {
    plain.name = fields.name;
  }
  if (fields.externalLink !== undefined && fields.externalLink !== '') {
    plain.externalLink = fields.externalLink;
  }
  if (fields.source !== undefined) {
    plain.source = fields.source || null;
  }
  const isPublic = parseOptionalBooleanField(fields.isPublic);
  const isActive = parseOptionalBooleanField(fields.isActive);
  if (isPublic !== undefined) {
    plain.isPublic = isPublic;
  }
  if (isActive !== undefined) {
    plain.isActive = isActive;
  }
  const removeImage = parseOptionalBooleanField(fields.removeImage);
  if (removeImage !== undefined) {
    plain.removeImage = removeImage;
  }
  return plain;
}
