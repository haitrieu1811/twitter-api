import cors from 'cors';
import express from 'express';
import fs from 'fs';
import { createServer } from 'http';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

import { UPLOAD_VIDEO_DIR } from './constants/dir';
import { defaultErrorHandler } from './middlewares/error.middlewares';
import bookmarksRouter from './routes/bookmarks.routes';
import conversationsRouter from './routes/conversations.routes';
import likesRouter from './routes/likes.routes';
import mediasRouter from './routes/medias.routes';
import searchRouter from './routes/search.routes';
import staticRouter from './routes/static.routes';
import tweetsRouter from './routes/tweets.routes';
import usersRouter from './routes/users.routes';
import databaseService from './services/database.services';
import { initFolder } from './utils/file';
import './utils/s3';
import initSocket from './utils/socket';
import { ENV_CONFIG } from './constants/config';
initFolder();

databaseService.connect().then(() => {
  databaseService.indexUsers();
  databaseService.indexRefreshTokens();
  databaseService.indexFollowers();
  databaseService.indexVideoStatus();
  databaseService.indexHashtags();
  databaseService.indexBookmarks();
  databaseService.indexLikes();
  databaseService.indexTweets();
});
const app = express();
const httpServer = createServer(app);
const port = ENV_CONFIG.PORT || 4000;
const file = fs.readFileSync(path.resolve('twitter-swagger.yaml'), 'utf8');
const swaggerDocument = YAML.parse(file);

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/users', usersRouter);
app.use('/tweets', tweetsRouter);
app.use('/bookmarks', bookmarksRouter);
app.use('/likes', likesRouter);
app.use('/search', searchRouter);
app.use('/conversations', conversationsRouter);
app.use('/medias', mediasRouter);
app.use('/static', staticRouter);
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR));
app.use(defaultErrorHandler);

initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
