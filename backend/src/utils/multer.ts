/**

 * @module multer

 *

 * **Purpose:** Central Multer disk storage and file-type guards for book and cover uploads.

 *

 * **Responsibilities:** UUID filenames; route uploads to `uploads/books` vs `uploads/covers`; enforce extension allowlists and size exports for interceptors.

 *

 * **Integration notes:** Paths are relative to process CWD—running the app from a different directory breaks uploads unless adjusted.

 */



import { diskStorage } from 'multer';

import { extname } from 'path';

import { BadRequestException } from '@nestjs/common';

import { v4 as uuidv4 } from 'uuid';



/**

 * Multipart handling via Nest interceptors; disk storage avoids large buffers in RAM.

 */



// ─── Allowed extensions and MIME types ───



const BOOK_EXTENSIONS = ['.epub', '.pdf'];
const BOOK_MIMETYPES = ['application/epub+zip', 'application/pdf'];

const COVER_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const COVER_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];



// ─── Covers ───



export const coverStorage = diskStorage({

  destination: './uploads/covers',

  filename: (_req, file, callback) => {

    const uniqueName = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;

    callback(null, uniqueName);

  },

});



// ─── Combined storage (POST /api/books: `file` + `cover`) ───



export const combinedStorage = diskStorage({

  destination: (_req, file, callback) => {

    const folder = file.fieldname === 'cover' ? './uploads/covers' : './uploads/books';

    callback(null, folder);

  },

  filename: (_req, file, callback) => {

    const uniqueName = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;

    callback(null, uniqueName);

  },

});



// ─── fileFilter (runs before write) ───



export const combinedFileFilter = (

  _req: any,

  file: Express.Multer.File,

  callback: (error: Error | null, acceptFile: boolean) => void,

) => {

  const ext = extname(file.originalname).toLowerCase();



  if (file.fieldname === 'file') {

    if (!BOOK_EXTENSIONS.includes(ext) || !BOOK_MIMETYPES.includes(file.mimetype)) {

      return callback(

        new BadRequestException(`Invalid book file type. Allowed: ${BOOK_EXTENSIONS.join(', ')}`),

        false,

      );

    }

  } else if (file.fieldname === 'cover') {

    if (!COVER_EXTENSIONS.includes(ext) || !COVER_MIMETYPES.includes(file.mimetype)) {

      return callback(

        new BadRequestException(`Invalid cover file type. Allowed: ${COVER_EXTENSIONS.join(', ')}`),

        false,

      );

    }

  }



  callback(null, true);

};



// ─── Cover-only upload (PATCH /api/books/:id/cover) ───



export const coverFileFilter = (

  _req: any,

  file: Express.Multer.File,

  callback: (error: Error | null, acceptFile: boolean) => void,

) => {

  const ext = extname(file.originalname).toLowerCase();



  if (!COVER_EXTENSIONS.includes(ext) || !COVER_MIMETYPES.includes(file.mimetype)) {

    return callback(

      new BadRequestException(`Invalid cover file type. Allowed: ${COVER_EXTENSIONS.join(', ')}`),

      false,

    );

  }



  callback(null, true);

};



// ─── Size limits ───



export const BOOK_MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export const COVER_MAX_SIZE = 5 * 1024 * 1024;  // 5 MB

