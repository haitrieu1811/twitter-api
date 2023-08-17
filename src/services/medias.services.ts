import { CompleteMultipartUploadOutput } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import { Request } from 'express';
import fs from 'fs';
import fsPromise from 'fs/promises';
import mime from 'mime';
import path from 'path';
import sharp from 'sharp';
import { rimrafSync } from 'rimraf';

import { isProduction } from '~/constants/config';
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir';
import { EncodingStatus, MediaType } from '~/constants/enums';
import { Media } from '~/models/Other';
import VideoStatus from '~/models/schemas/VideoStatus.schema';
import { getNameFromFullname, handleUploadImage, handleUploadVideo } from '~/utils/file';
import { uploadFileToS3 } from '~/utils/s3';
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video';
import databaseService from './database.services';
import { getFiles } from '~/utils/file';
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
    const idName = getNameFromFullname(item.split('\\').pop() as string);
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: idName,
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
      const idName = getNameFromFullname(videoPath.split('\\').pop() as string);
      await databaseService.videoStatus.updateOne(
        {
          name: idName
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
        fs.unlinkSync(videoPath);
        const files = getFiles(path.resolve(UPLOAD_VIDEO_DIR, idName));
        await Promise.all(
          files.map((filepath) => {
            const filename = `videos-hls${filepath.replace(path.resolve(UPLOAD_VIDEO_DIR), '').replace(/\\/g, '/')}`;
            return uploadFileToS3({
              filepath,
              filename,
              contentType: mime.getType(filepath) as string
            });
          })
        );
        rimrafSync(path.resolve(UPLOAD_VIDEO_DIR, idName));
        await databaseService.videoStatus.updateOne(
          {
            name: idName
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
              name: idName
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
  // Upload hình ảnh
  async handleUploadImage(req: Request) {
    const images = await handleUploadImage(req);
    const result: Media[] = await Promise.all(
      images.map(async (image) => {
        const newName = getNameFromFullname(image.newFilename);
        const newFullName = `${newName}.jpg`;
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullName);
        await sharp(image.filepath).jpeg().toFile(newPath);
        const s3Result = await uploadFileToS3({
          filename: `images/${newFullName}`,
          filepath: newPath,
          contentType: mime.getType(newPath) as string
        });
        await Promise.all([fsPromise.unlink(image.filepath), fsPromise.unlink(newPath)]);
        return {
          url: (s3Result as CompleteMultipartUploadOutput).Location as string,
          type: MediaType.Image
        };
        // return {
        //   url: isProduction
        //     ? `${process.env.HOST}/static/image/${newFullName}`
        //     : `http://localhost:${process.env.PORT}/static/image/${newFullName}`,
        //   type: MediaType.Image
        // };
      })
    );
    return result;
  }

  // Upload video
  async handleUploadVideo(req: Request) {
    const videos = await handleUploadVideo(req);
    const result: Media[] = await Promise.all(
      videos.map(async (video) => {
        const s3Result = await uploadFileToS3({
          filename: `videos/${video.newFilename}`,
          filepath: video.filepath,
          contentType: mime.getType(video.filepath) as string
        });
        fs.unlinkSync(video.filepath);
        return {
          url: (s3Result as CompleteMultipartUploadOutput).Location as string,
          type: MediaType.Video
        };
        // return {
        //   url: isProduction
        //     ? `${process.env.HOST}/static/video-stream/${video.newFilename}`
        //     : `http://localhost:${process.env.PORT}/static/video-stream/${video.newFilename}`,
        //   type: MediaType.Video
        // };
      })
    );
    return result;
  }

  // Upload video HLS
  async handleUploadVideoHLS(req: Request) {
    const videos = await handleUploadVideo(req);
    const result: Media[] = await Promise.all(
      videos.map(async (video) => {
        const fileName = getNameFromFullname(video.newFilename);
        queue.enqueue(video.filepath);
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

  // Lấy video status
  async getVideoStatus(idName: string) {
    const data = await databaseService.videoStatus.findOne({ name: idName });
    return data;
  }
}

const mediasService = new MediasService();
export default mediasService;
