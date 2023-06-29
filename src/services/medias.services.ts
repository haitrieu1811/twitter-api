import { config } from 'dotenv';
import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

import { isProduction } from '~/constants/config';
import { UPLOAD_IMAGE_DIR } from '~/constants/dir';
import { MediaType } from '~/constants/enums';
import { Media } from '~/models/Other';
import { getNameFromFullname, handleUploadImage, handleUploadVideo } from '~/utils/file';
config();

class MediasService {
  async handleUploadImage(req: Request) {
    const images = await handleUploadImage(req);
    const result: Media[] = await Promise.all(
      images.map(async (image) => {
        const newName = getNameFromFullname(image.newFilename);
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`);
        await sharp(image.filepath).jpeg().toFile(newPath);
        fs.unlinkSync(image.filepath);
        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
          type: MediaType.Image
        };
      })
    );
    return result;
  }

  async handleUploadVideo(req: Request) {
    const videos = await handleUploadVideo(req);
    const result: Media[] = videos.map((video) => {
      return {
        url: isProduction
          ? `${process.env.HOST}/static/video/${video.newFilename}`
          : `http://localhost:${process.env.PORT}/static/video/${video.newFilename}`,
        type: MediaType.Video
      };
    });
    return result;
  }
}

const mediasService = new MediasService();
export default mediasService;
