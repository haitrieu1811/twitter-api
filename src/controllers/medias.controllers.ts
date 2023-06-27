import { NextFunction, Request, Response } from 'express';
import path from 'path';

export const uploadSingleImage = async (req: Request, res: Response, next: NextFunction) => {
  const formidable = (await import('formidable')).default;
  const form = formidable({
    uploadDir: path.resolve('uploads'),
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 300 * 1024 // 300KB
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      throw err;
    }
    return res.json({
      message: 'Upload single image succeed'
    });
  });
};
