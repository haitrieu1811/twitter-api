import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import mime from 'mime';
import path from 'path';

import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import mediasService from '~/services/medias.services';
import { sendFileFromS3 } from '~/utils/s3';

export const uploadImageController = async (req: Request, res: Response) => {
  const result = await mediasService.handleUploadImage(req);
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result
  });
};

export const uploadVideoController = async (req: Request, res: Response) => {
  const result = await mediasService.handleUploadVideo(req);
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result
  });
};

export const uploadVideoHLSController = async (req: Request, res: Response) => {
  const result = await mediasService.handleUploadVideoHLS(req);
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result
  });
};

export const serveImageController = (req: Request, res: Response) => {
  const { name } = req.params;
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      return res.status((err as any).status).send('File not found');
    }
  });
};

export const serveM3u8Controller = (req: Request, res: Response) => {
  const { id } = req.params;
  sendFileFromS3(res, `videos-hls/${id}/master.m3u8`);
  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (err) => {
  //   if (err) {
  //     return res.status((err as any).status).send('File not found');
  //   }
  // });
};

export const serveSegmentController = (req: Request, res: Response, next: NextFunction) => {
  const { id, v, segment } = req.params;
  sendFileFromS3(res, `videos-hls/${id}/${v}/${segment}`);
  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment), (err) => {
  //   if (err) {
  //     return res.status((err as any).status).send('File not found');
  //   }
  // });
};

export const serveVideoStreamController = (req: Request, res: Response, next: NextFunction) => {
  const { range } = req.headers;

  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header');
  }
  const { name } = req.params;
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name);
  // 1MB = 10^6 bytes (tính theo hệ thập phân, đây là thứ mà chúng ta hay thấy trên UI)
  // Còn nếu tính theo hệ nhị phân thì 1MB = 2^20 bytes (1024 * 1024)

  // Dung lượng video (bytes)
  const videoSize = fs.statSync(videoPath).size;
  // Dung lượng video cho mỗi phân đoạn stream (1MB)
  const chunkSize = 10 ** 6;
  // Lấy giá trị byte bắt đầu từ Headers Range
  const start = Number(range.replace(/\D/g, ''));
  // Lấy giá trị byte kết thúc, vượt quá dung lượng video thì lấy giá trị videoSize
  const end = Math.min(start + chunkSize, videoSize - 1);

  // Dung lượng thực tế cho mỗi đoạn video stream
  // Thường đây sẽ là chunkSize, ngoại trừ đoạn cuối cùng
  const contentLength = end - start + 1;
  const contentType = mime.getType(videoPath) || 'video/*';
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  };
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers);
  const videoStreams = fs.createReadStream(videoPath, { start, end });
  videoStreams.pipe(res);
};

export const videoStatusController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await mediasService.getVideoStatus(id);
  return res.json({
    message: USERS_MESSAGES.GET_VIDEO_STATUS_SUCCEED,
    result
  });
};
