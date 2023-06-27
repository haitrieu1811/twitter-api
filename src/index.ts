import { config } from 'dotenv';
import express from 'express';

import { defaultErrorHandler } from './middlewares/error.middlewares';
import mediasRouter from './routes/medias.routes';
import usersRouter from './routes/users.routes';
import databaseService from './services/database.services';
import { initFolder } from './utils/file';
config();

databaseService.connect();

const app = express();
const port = process.env.PORT;

initFolder();

app.use(express.json());
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
