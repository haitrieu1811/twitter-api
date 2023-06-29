import { NextFunction, Request, Response } from 'express';
import path from 'path';

import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir';
import { USERS_MESSAGES } from '~/constants/messages';
import mediasService from '~/services/medias.services';

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.handleUploadImage(req);
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result
  });
};

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.handleUploadVideo(req);
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result
  });
};

export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      return res.status((err as any).status).send('File not found');
    }
  });
};

export const serveVideoController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, name));
};
