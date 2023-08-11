import { ObjectId } from 'mongodb';

import { TweetAudience, TweetType } from '~/constants/enums';
import { Media } from '../Other';

interface TweetConstructor {
  _id?: ObjectId;
  user_id: ObjectId;
  type: TweetType;
  audience: TweetAudience;
  content: string;
  parent_id: null | string; //  chỉ null khi tweet gốc
  hashtags: string[];
  mentions: string[];
  medias: Media[];
  guest_views?: number;
  user_views?: number;
  created_at?: Date;
  updated_at?: Date;
}

export default class Tweet {
  _id?: ObjectId;
  user_id: ObjectId;
  type: TweetType;
  audience: TweetAudience;
  content: string;
  parent_id: null | ObjectId; //  chỉ null khi tweet gốc
  hashtags: ObjectId[];
  mentions: ObjectId[];
  medias: Media[];
  guest_views: number;
  user_views: number;
  created_at: Date;
  updated_at: Date;

  constructor(tweet: TweetConstructor) {
    const date = new Date();
    this._id = tweet._id;
    this.user_id = tweet.user_id;
    this.type = tweet.type;
    this.audience = tweet.audience;
    this.content = tweet.content;
    this.parent_id = tweet.parent_id ? new ObjectId(tweet.parent_id) : null; //  chỉ null khi tweet gốc
    this.hashtags = tweet.hashtags.map((hashtag) => new ObjectId(hashtag));
    this.mentions = tweet.mentions.map((mention) => new ObjectId(mention));
    this.medias = tweet.medias;
    this.guest_views = tweet.guest_views || 0;
    this.user_views = tweet.user_views || 0;
    this.created_at = tweet.created_at || date;
    this.updated_at = tweet.updated_at || date;
  }
}
