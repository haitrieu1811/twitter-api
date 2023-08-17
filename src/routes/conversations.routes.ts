import { Router } from 'express';

import { getConversationsController } from '~/controllers/conversations.controllers';
import { paginationValidator } from '~/middlewares/common.middlewares';
import { getConversationsValidator } from '~/middlewares/conversations.middlewares';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const conversationsRouter = Router();

// Lấy danh sách tin nhắn
conversationsRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  verifiedUserValidator,
  getConversationsValidator,
  paginationValidator,
  wrapRequestHandler(getConversationsController)
);

export default conversationsRouter;
