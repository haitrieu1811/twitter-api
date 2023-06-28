import { config } from 'dotenv';
import express from 'express';

import { UPLOAD_DIR } from './constants/dir';
import { defaultErrorHandler } from './middlewares/error.middlewares';
import mediasRouter from './routes/medias.routes';
import usersRouter from './routes/users.routes';
import databaseService from './services/database.services';
import { initFolder } from './utils/file';
import staticRouter from './routes/static.routes';
config();

databaseService.connect();
initFolder();
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use('/static', staticRouter);
// app.use('/static', express.static(UPLOAD_DIR));
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
