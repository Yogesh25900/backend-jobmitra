import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const maxSize: number = 100 * 1024 * 1024; // 100MB
const maxVideoSize: number = 50 * 1024 * 1024; // 50MB

const ensureFolderExists = (folderPath: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

const storage: StorageEngine = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ): void => {
    let folder = '';

    switch (file.fieldname) {
      case 'profilePicture':
        folder = path.join('public', 'profile_pictures');
        break;
      case 'itemPhoto':
        folder = path.join('public', 'item_photos');
        break;
      case 'itemVideo':
        folder = path.join('public', 'item_videos');
        break;
      case 'resume':
        folder = path.join('public', 'resumes');
        break;
      case 'coverLetterDocument':
        folder = path.join('public', 'cover_letters');
        break;
      case 'logoPath':
        folder = path.join('public', 'logos');
        break;
      default:
        cb(new Error('Invalid field name for upload.'), '');
        return;
    }

    ensureFolderExists(folder);
    cb(null, folder);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ): void => {
    const ext = path.extname(file.originalname);
    let prefix = 'file';

    switch (file.fieldname) {
      case 'logoPath':
        prefix = 'logo';
        break;
      case 'profilePicture':
        prefix = 'pro-pic';
        break;
      case 'itemPhoto':
        prefix = 'itm-pic';
        break;
      case 'itemVideo':
        prefix = 'item-vid';
        break;
      case 'resume':
        prefix = 'resume';
        break;
      case 'coverLetterDocument':
        prefix = 'cover-letter';
        break;
    }

    cb(null, `${prefix}-${Date.now()}${ext}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  switch (file.fieldname) {
    case 'itemVideo':
      if (!file.originalname.match(/\.(mp4|avi|mov|wmv)$/i)) {
        cb(new Error('Video format not supported.'));
        return;
      }
      cb(null, true);
      break;

    case 'logoPath':
    case 'profilePicture':
    case 'itemPhoto':
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        cb(new Error('Image format not supported.'));
        return;
      }
      cb(null, true);
      break;

    case 'resume':
    case 'coverLetterDocument':
      if (!file.originalname.match(/\.(pdf|doc|docx)$/i)) {
        cb(new Error(`${file.fieldname} must be PDF or DOC format.`));
        return;
      }
      cb(null, true);
      break;

    default:
      cb(new Error('Invalid field name for upload.'));
  }
};

// Multi-file uploads
export const uploadFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize },
});

// Single-type specialized uploads
export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize },
});

export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxVideoSize },
});

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize },
});

// Parse form fields only (no files)
export const parseFormData = multer().none();

// Export default
export default uploadFiles;
