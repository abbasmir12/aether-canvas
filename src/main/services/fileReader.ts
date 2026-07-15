import { readFileSync, statSync } from 'node:fs';
import { basename, extname } from 'node:path';

import sharp from 'sharp';

export interface PreparedFile {
  base64Data: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  isImage: boolean;
}

const MIME_TYPES: Record<string, string> = {
  '.csv': 'text/csv',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.md': 'text/plain',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.tsv': 'text/tab-separated-values',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const IMAGE_EXTENSIONS = new Set(['.gif', '.jpeg', '.jpg', '.png', '.webp']);
const MAX_DIRECT_FILE_BYTES = 50 * 1024 * 1024;

export function mimeTypeForPath(filePath: string): string {
  const extension = extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[extension];

  if (!mimeType) {
    throw new Error(`Aether does not support ${extension || 'this file type'} yet.`);
  }

  return mimeType;
}

export function prepareFileForAPI(filePath: string): PreparedFile {
  const stats = statSync(filePath);

  if (!stats.isFile()) {
    throw new Error('The selected path is not a file.');
  }

  if (stats.size > MAX_DIRECT_FILE_BYTES) {
    throw new Error('Files larger than 50 MB cannot be analyzed directly.');
  }

  const extension = extname(filePath).toLowerCase();
  const buffer = readFileSync(filePath);

  return {
    base64Data: buffer.toString('base64'),
    mimeType: mimeTypeForPath(filePath),
    fileName: basename(filePath),
    fileSize: stats.size,
    isImage: IMAGE_EXTENSIONS.has(extension),
  };
}

export async function generateThumbnail(filePath: string): Promise<string | null> {
  const extension = extname(filePath).toLowerCase();

  if (!IMAGE_EXTENSIONS.has(extension)) return null;

  const thumbnail = await sharp(filePath)
    .rotate()
    .resize({ width: 300, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  return thumbnail.toString('base64');
}
