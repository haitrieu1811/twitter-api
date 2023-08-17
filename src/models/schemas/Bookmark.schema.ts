import { ObjectId } from 'mongodb';

interface BookmarkConstructor {
  _id?: ObjectId;
  user_id: string;
  tweet_id: string;
  created_at?: Date;
}

export default class Bookmark {
  _id?: ObjectId;
  user_id: ObjectId;
  tweet_id: ObjectId;
  created_at: Date;

  constructor({ _id, user_id, tweet_id, created_at }: BookmarkConstructor) {
    this._id = _id || new ObjectId();
    this.user_id = new ObjectId(user_id);
    this.tweet_id = new ObjectId(tweet_id);
    this.created_at = created_at || new Date();
  }
}
