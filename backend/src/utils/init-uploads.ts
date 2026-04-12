/**

 * @module init-uploads

 *

 * **Purpose:** Ensure filesystem upload roots exist before Multer writes (avoids ENOENT on first upload).

 *

 * **Responsibilities:** Idempotent `mkdir -p` style creation for configured relative directories.

 *

 * **Integration notes:** Invoked at import time from `main.ts`—ordering guarantees dirs exist before listeners accept traffic.

 */



import { existsSync, mkdirSync } from 'fs';



/**

 * Create upload directories if missing (`mkdirSync` recursive).

 */

const UPLOAD_DIRS = ['uploads/books', 'uploads/covers', 'uploads/avatars'];



export function initUploadDirs(): void {

  for (const dir of UPLOAD_DIRS) {

    if (!existsSync(dir)) {

      mkdirSync(dir, { recursive: true });

    }

  }

}

