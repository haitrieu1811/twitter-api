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

  constructor(bookmark: BookmarkConstructor) {
    this._id = bookmark._id || new ObjectId();
    this.user_id = new ObjectId(bookmark.user_id);
    this.tweet_id = new ObjectId(bookmark.tweet_id);
    this.created_at = bookmark.created_at || new Date();
  }
}
