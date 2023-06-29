import { Request } from 'express';
import { File } from 'formidable';
import fs from 'fs';
import path from 'path';

import { UPLOAD_IMAGE_DIR, UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir';

export const initFolder = () => {
  [UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true // Tạo nested folder
      });
    }
  });
};

export const getNameFromFullname = (fullname: string) => {
  const nameArr = fullname.split('.');
  nameArr.pop();
  return nameArr.join('');
};

export const getExtensionFromFullname = (fullname: string) => {
  const nameArr = fullname.split('.');
  return nameArr[nameArr.length - 1];
};

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default;
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_DIR,
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
        return reject(err);
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'));
      }
      return resolve(files.image as File[]);
    });
  });
};

export const handleUploadVideo = async (req: Request) => {
  const formiable = (await import('formidable')).default;
  const form = formiable({
    uploadDir: UPLOAD_VIDEO_DIR,
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: ({ name, originalFilename, mimetype }) => {
      return true;
    }
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'));
      }
      const videos = files.video as File[];
      videos.forEach((video) => {
        const extension = getExtensionFromFullname(video.originalFilename as string);
        fs.renameSync(video.filepath, `${video.filepath}.${extension}`);
        video.newFilename = `${video.newFilename}.${extension}`;
      });
      return resolve(videos);
    });
  });
};
