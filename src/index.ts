import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { UPLOAD_VIDEO_DIR } from './constants/dir';
import { defaultErrorHandler } from './middlewares/error.middlewares';
import bookmarksRouter from './routes/bookmarks.routes';
import likesRouter from './routes/likes.routes';
import mediasRouter from './routes/medias.routes';
import searchRouter from './routes/search.routes';
import staticRouter from './routes/static.routes';
import tweetsRouter from './routes/tweets.routes';
import usersRouter from './routes/users.routes';
import databaseService from './services/database.services';
import { initFolder } from './utils/file';
import './utils/s3';
config();
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
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/users', usersRouter);
app.use('/tweets', tweetsRouter);
app.use('/bookmarks', bookmarksRouter);
app.use('/likes', likesRouter);
app.use('/search', searchRouter);
app.use('/medias', mediasRouter);
app.use('/static', staticRouter);
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR));
app.use(defaultErrorHandler);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000'
  }
});

const users: {
  [key: string]: {
    socket_id: string;
  };
} = {};

// Kết nối
io.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`);

  const user_id = socket.handshake.auth._id;
  users[user_id] = {
    socket_id: socket.id
  };

  // Gửi tin nhắn
  socket.on('private message', (data) => {
    console.log(data);
    const receiver_socket_id = users[data.to].socket_id;
    console.log('>>> receiver_socket_id', receiver_socket_id);
    socket.to(receiver_socket_id).emit('receive private message', {
      content: data.content,
      from: user_id
    });
  });

  // Ngắt kết nối
  socket.on('disconnect', () => {
    delete users[user_id];
    console.log(`User ${socket.id} disconnected`);
    console.log(users);
  });
});

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
