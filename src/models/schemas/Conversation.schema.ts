import { ObjectId } from 'mongodb';

interface ConversationConstructor {
  _id?: ObjectId;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at?: Date;
  updated_at?: Date;
}

export default class Conversation {
  _id?: ObjectId;
  sender_id: ObjectId;
  receiver_id: ObjectId;
  content: string;
  created_at: Date;
  updated_at: Date;

  constructor({ _id, sender_id, receiver_id, content, created_at, updated_at }: ConversationConstructor) {
    const date = new Date();
    this._id = _id;
    this.sender_id = new ObjectId(sender_id);
    this.receiver_id = new ObjectId(receiver_id);
    this.content = content;
    this.created_at = created_at || date;
    this.updated_at = updated_at || date;
  }
}
