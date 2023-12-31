import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

const env = process.env.NODE_ENV;
const envFilename = `.env.${env}`;

if (!env) {
  console.log('You have not provided the NODE_ENV environment variable (e.g. development, production)');
  console.log(`Discovered NODE_ENV = ${env}`);
  process.exit(1);
}
console.log(`Discovered NODE_ENV = ${env}, so the app will use the environment file ${envFilename}`);
if (!fs.existsSync(path.resolve(envFilename))) {
  console.log(`Environment file ${envFilename} not found`);
  console.log(
    'Note: App does not use .env file, for example development environment, app will use .env.development file'
  );
  console.log(`Please create a file ${envFilename} and refer to the content in the file .env.example`);
  process.exit(1);
}

config({
  path: envFilename
});

export const isProduction = env === 'production';

export const ENV_CONFIG = {
  PORT: process.env.PORT as string,
  HOST: process.env.HOST as string,
  PASSWORD_SECRET: process.env.PASSWORD_SECRET as string,
  DB_NAME: process.env.DB_NAME as string,
  DB_USERNAME: process.env.DB_USERNAME as string,
  DB_PASSWORD: process.env.DB_PASSWORD as string,
  DB_USERS_COLLECTION: process.env.DB_USERS_COLLECTION as string,
  DB_REFRESH_TOKENS_COLLECTION: process.env.DB_REFRESH_TOKENS_COLLECTION as string,
  DB_FOLLOWERS_COLLECTION: process.env.DB_FOLLOWERS_COLLECTION as string,
  DB_VIDEO_STATUS_COLLECTION: process.env.DB_VIDEO_STATUS_COLLECTION as string,
  DB_TWEETS_COLLECTION: process.env.DB_TWEETS_COLLECTION as string,
  DB_HASHTAGS_COLLECTION: process.env.DB_HASHTAGS_COLLECTION as string,
  DB_BOOKMARKS_COLLECTION: process.env.DB_BOOKMARKS_COLLECTION as string,
  DB_LIKES_COLLECTION: process.env.DB_LIKES_COLLECTION as string,
  DB_CONVERSATIONS_COLLECTION: process.env.DB_CONVERSATIONS_COLLECTION as string,
  JWT_SECRET_ACCESS_TOKEN: process.env.JWT_SECRET_ACCESS_TOKEN as string,
  JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN as string,
  JWT_SECRET_EMAIL_VERIFY_TOKEN: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
  JWT_SECRET_FORGOT_PASSWORD_TOKEN: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
  VERIFY_EMAIL_TOKEN_EXPIRES_IN: process.env.VERIFY_EMAIL_TOKEN_EXPIRES_IN as string,
  FORGOT_PASSWORD_TOKEN_EXPIRES_IN: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as string,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI as string,
  CLIENT_REDIRECT_CALLBACK: process.env.CLIENT_REDIRECT_CALLBACK as string,
  CLIENT_URL: process.env.CLIENT_URL as string,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID as string,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY as string,
  AWS_REGION: process.env.AWS_REGION as string,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME as string,
  SES_FROM_ADDRESS: process.env.SES_FROM_ADDRESS as string
} as const;
