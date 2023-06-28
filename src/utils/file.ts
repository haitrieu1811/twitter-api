import { Request } from 'express';
import { File } from 'formidable';
import fs from 'fs';

import { UPLOAD_TEMP_DIR } from '~/constants/dir';

export const initFolder = () => {
  const uploadsPathFolder = UPLOAD_TEMP_DIR;
  if (!fs.existsSync(uploadsPathFolder)) {
    fs.mkdirSync(uploadsPathFolder, {
      recursive: true // Tạo nested folder
    });
  }
};

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default;
  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 300 * 1024, // 300KB
    maxTotalFileSize: 300 * 1024 * 4,
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'));
      if (!valid) {
        form.emit('errors' as any, new Error('File type is not valid') as any);
      }
      return valid;
    }
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        reject(new Error('File is empty'));
      }
      resolve(files.image as File[]);
    });
  });
};

export const getNameFromFullname = (fullname: string) => {
  const nameArr = fullname.split('.');
  nameArr.pop();
  return nameArr.join('');
};
