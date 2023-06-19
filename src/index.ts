import { config } from 'dotenv';
import express from 'express';

import { defaultErrorHandler } from './middlewares/error.middlewares';
import usersRouter from './routes/users.routes';
import databaseService from './services/database.services';
config();

databaseService.connect();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use('/users', usersRouter);
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
