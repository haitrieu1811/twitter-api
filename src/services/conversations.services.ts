import { ObjectId } from 'mongodb';

import { Pagination } from '~/models/requests/Common.requests';
import databaseService from './database.services';

class ConversationsService {
  async getConversations({
    sender_id,
    receiver_id,
    page,
    limit
  }: { sender_id: string; receiver_id: string } & Pagination) {
    const _page = page ? Number(page) : 1;
    const _limit = limit ? Number(limit) : 20;
    const match = {
      $or: [
        {
          sender_id: new ObjectId(sender_id),
          receiver_id: new ObjectId(receiver_id)
        },
        {
          sender_id: new ObjectId(receiver_id),
          receiver_id: new ObjectId(sender_id)
        }
      ]
    };
    const [conversations, total] = await Promise.all([
      databaseService.conversations
        .find(match)
        .sort({ created_at: -1 })
        .skip((_page - 1) * _limit)
        .limit(_limit)
        .toArray(),
      databaseService.conversations.countDocuments(match)
    ]);
    return {
      conversations,
      total,
      page: _page,
      limit: _limit,
      page_size: Math.ceil(total / _limit)
    };
  }
}

const conversationService = new ConversationsService();
export default conversationService;
