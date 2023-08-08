import { config } from 'dotenv';
import { Request } from 'express';
import fs from 'fs';
import fsPromise from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

import { isProduction } from '~/constants/config';
import { UPLOAD_IMAGE_DIR } from '~/constants/dir';
import { EncodingStatus, MediaType } from '~/constants/enums';
import { Media } from '~/models/Other';
import { getNameFromFullname, handleUploadImage, handleUploadVideo } from '~/utils/file';
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video';
import databaseService from './database.services';
import VideoStatus from '~/models/schemas/VideoStatus.schema';
config();

class Queue {
  items: string[];
  encoding: boolean;

  constructor() {
    this.items = [];
    this.encoding = false;
  }

  async enqueue(item: string) {
    this.items.push(item);
    const name = getNameFromFullname(item.split('\\').pop() as string);
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name,
        status: EncodingStatus.Pending
      })
    );
    this.processEncode();
  }

  async processEncode() {
    if (this.encoding) return;
    if (this.items.length > 0) {
      this.encoding = true;
      const videoPath = this.items[0];
      const name = getNameFromFullname(videoPath.split('\\').pop() as string);
      await databaseService.videoStatus.updateOne(
        {
          name
        },
        {
          $set: {
            status: EncodingStatus.Processing
          },
          $currentDate: {
            updated_at: true
          }
        }
      );
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath);
        this.items.shift();
        await fsPromise.unlink(videoPath);
        await databaseService.videoStatus.updateOne(
          {
            name
          },
          {
            $set: {
              status: EncodingStatus.Succeed
            },
            $currentDate: {
              updated_at: true
            }
          }
        );
        console.log(`Encode video ${videoPath} success`);
      } catch (error) {
        await databaseService.videoStatus
          .updateOne(
            {
              name
            },
            {
              $set: {
                status: EncodingStatus.Failed
              },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((error) => {
            console.log('Update video status error', error);
          });
        console.error(`Encode video ${videoPath} error`);
        console.error(error);
      }
      this.encoding = false;
      this.processEncode();
    } else {
      console.log('Encode video queue is empty');
    }
  }
}
const queue = new Queue();

class MediasService {
  async handleUploadImage(req: Request) {
    const images = await handleUploadImage(req);
    const result: Media[] = await Promise.all(
      images.map(async (image) => {
        const newName = `${image.newFilename}.jpg`;
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newName);
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
          ? `${process.env.HOST}/static/video-stream/${video.newFilename}`
          : `http://localhost:${process.env.PORT}/static/video-stream/${video.newFilename}`,
        type: MediaType.Video
      };
    });
    return result;
  }

  async handleUploadVideoHLS(req: Request) {
    const videos = await handleUploadVideo(req);
    const result: Media[] = await Promise.all(
      videos.map(async (video) => {
        const fileName = getNameFromFullname(video.newFilename);
        const filepathConverted = video.filepath.replace('/\\/g', '/');
        queue.enqueue(filepathConverted);
        return {
          url: isProduction
            ? `${process.env.HOST}/static/video-hls/${fileName}/master.m3u8`
            : `http://localhost:${process.env.PORT}/static/video-hls/${fileName}/master.m3u8`,
          type: MediaType.HLS
        };
      })
    );
    return result;
  }

  async getVideoStatus(idName: string) {
    const data = await databaseService.videoStatus.findOne({ name: idName });
    return data;
  }
}

const mediasService = new MediasService();
export default mediasService;
