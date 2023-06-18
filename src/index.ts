import express, { NextFunction, Request, Response } from 'express';
import usersRouter from './routes/users.routes';
import databaseService from './services/database.services';

const app = express();
const port = 3000;

app.use(express.json());
app.use('/users', usersRouter);
databaseService.connect();
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({
    message: err.message
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
