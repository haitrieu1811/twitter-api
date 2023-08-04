import { config } from 'dotenv';
import express from 'express';

import { defaultErrorHandler } from './middlewares/error.middlewares';
import mediasRouter from './routes/medias.routes';
import staticRouter from './routes/static.routes';
import usersRouter from './routes/users.routes';
import databaseService from './services/database.services';
import { initFolder } from './utils/file';
import { UPLOAD_VIDEO_DIR } from './constants/dir';
config();
initFolder();

databaseService.connect();
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use('/static', staticRouter);
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR));
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
