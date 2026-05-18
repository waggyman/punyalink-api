import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { extname, join } from 'path';
import { pipeline } from 'stream/promises';
import { isValidStoredImageKey } from './image-url.util';

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const MIME_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
};

@Injectable()
export class ImageStorageService {
  private readonly imagesDir = join(process.cwd(), 'public', 'images');

  async saveUploadedFile(
    file: { mimetype: string; file: NodeJS.ReadableStream },
  ): Promise<string> {
    const mime = file.mimetype?.toLowerCase() ?? '';
    if (!ALLOWED_MIME.has(mime)) {
      throw new BadRequestException(
        'Only PNG, JPEG, and WebP images are allowed',
      );
    }

    const ext = MIME_EXT[mime] ?? '.bin';
    const key = `${randomBytes(24).toString('base64url')}${ext}`;

    if (!isValidStoredImageKey(key)) {
      throw new InternalServerErrorException('Failed to generate image key');
    }

    await mkdir(this.imagesDir, { recursive: true });
    const dest = join(this.imagesDir, key);
    await pipeline(file.file, createWriteStream(dest));
    return key;
  }

  imagesDirectory(): string {
    return this.imagesDir;
  }
}
