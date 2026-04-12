/**
 * @module avatar-upload
 *
 * **Purpose:** Multer disk storage and extension allowlist dedicated to profile avatar uploads.
 *
 * **Responsibilities:** Save under `uploads/avatars` with UUID filenames; reject unsupported image extensions.
 *
 * **Integration notes:** Mirrors cover upload patterns; static URL prefix must match `main.ts` static assets.
 */

import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

const AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const AVATAR_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const avatarStorage = diskStorage({
  destination: './uploads/avatars',
  filename: (_req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;
    callback(null, uniqueName);
  },
});

export const avatarFileFilter = (
  _req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const ext = extname(file.originalname).toLowerCase();

  if (!AVATAR_EXTENSIONS.includes(ext) || !AVATAR_MIMETYPES.includes(file.mimetype)) {
    return callback(
      new BadRequestException(`Invalid avatar file type. Allowed: ${AVATAR_EXTENSIONS.join(', ')}`),
      false,
    );
  }

  callback(null, true);
};
