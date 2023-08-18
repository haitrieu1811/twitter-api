import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

import { ENV_CONFIG } from '~/constants/config';
import { UserVerifyStatus } from '~/constants/enums';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { verifyAccessToken } from '~/middlewares/common.middlewares';
import { ErrorWithStatus } from '~/models/Errors';
import { TokenPayload } from '~/models/requests/User.requests';
import Conversation from '~/models/schemas/Conversation.schema';
import databaseService from '~/services/database.services';

const initSocket = (httpServer: HttpServer) => {
  // Server instance
  const io = new Server(httpServer, {
    cors: {
      origin: ENV_CONFIG.CLIENT_URL
    }
  });

  // Danh sách người dùng đã kết nối
  const users: {
    [key: string]: {
      socket_id: string;
    };
  } = {};

  // Socket io middleware
  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth;
    const access_token = Authorization?.split(' ')[1];
    try {
      const decoded_authorization = await verifyAccessToken(access_token);
      const { verify } = decoded_authorization as TokenPayload;
      if (verify === UserVerifyStatus.Unverified) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_VERIFIED,
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      socket.handshake.auth.decoded_authorization = decoded_authorization;
      socket.handshake.auth.access_token = access_token;
      next();
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      });
    }
  });

  // Kết nối thành công (vượt qua được tất cả middleware)
  io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected`);

    // Thêm thông tin người dùng vừa kết nối vào danh sách
    const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload;
    if (user_id) {
      users[user_id] = {
        socket_id: socket.id
      };
    }

    // Socket instance middleware
    socket.use(async (_, next) => {
      try {
        const { access_token } = socket.handshake.auth;
        await verifyAccessToken(access_token);
        next();
      } catch (error) {
        next(new Error('Unauthorized'));
      }
    });

    // Xử lý khi không vượt qua được socket instance middleware
    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect();
      }
    });

    // Nhận tín hiệu khi có người gửi tin nhắn
    socket.on('send_message', async (data) => {
      const { receiver_id } = data.payload;
      const receiver_socket_id = users[receiver_id]?.socket_id; // socket id của người nhận
      const coversation = new Conversation(data.payload);
      // Lưu tin nhắn vào DB
      const { insertedId } = await databaseService.conversations.insertOne(coversation);
      coversation._id = insertedId;
      // Gửi tin nhắn tới người nhận
      if (receiver_socket_id) {
        socket.to(receiver_socket_id).emit('receive_message', {
          payload: coversation
        });
      }
    });

    // Khi bị ngắt kết nối
    socket.on('disconnect', () => {
      delete users[user_id];
      console.log(`User ${socket.id} disconnected`);
      console.log('>>> User connected: ', users);
    });

    console.log('>>> User connected: ', users);
  });
};

export default initSocket;
