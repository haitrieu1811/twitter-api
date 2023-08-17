import { Request, Response } from 'express';

import { CONVERSATIONS_MESSAGES } from '~/constants/messages';
import { Pagination } from '~/models/requests/Common.requests';
import { GetConversationsReqParams } from '~/models/requests/Conversation.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import conversationService from '~/services/conversations.services';

export const getConversationsController = async (
  req: Request<GetConversationsReqParams, any, any, Pagination>,
  res: Response
) => {
  const { receiver_id } = req.params;
  const { page, limit } = req.query;
  const { user_id: sender_id } = req.decoded_authorization as TokenPayload;
  const result = await conversationService.getConversations({ sender_id, receiver_id, page, limit });
  return res.json({
    message: CONVERSATIONS_MESSAGES.GET_CONVERSATIONS_SUCCEED,
    result: {
      conversations: result.conversations,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        page_size: result.page_size
      }
    }
  });
};
