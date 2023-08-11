import { MongoClient, Db, Collection } from 'mongodb';
import { config } from 'dotenv';

import User from '~/models/schemas/User.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import Follower from '~/models/schemas/Follower.schema';
import VideoStatus from '~/models/schemas/VideoStatus.schema';
import Tweet from '~/models/schemas/Tweet.schema';
import Hashtag from '~/models/schemas/Hashtag.schema';
import Bookmark from '~/models/schemas/Bookmark.schema';
import Like from '~/models/schemas/Like.schema';
config();

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter.pesqzad.mongodb.net/?retryWrites=true&w=majority`;

class DatabaseService {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(process.env.DB_NAME);
  }

  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 });
      console.log('Pinged your deployment. You successfully connected to MongoDB!');
    } catch (error) {
      console.log('Error', error);
      throw error;
    }
  }

  async indexUsers() {
    const exist = await this.users.indexExists(['email_1_password_1', 'email_1', 'username_1']);
    if (!exist) {
      this.users.createIndex({ email: 1, password: 1 });
      this.users.createIndex({ email: 1 }, { unique: true });
      this.users.createIndex({ username: 1 }, { unique: true });
    }
  }

  async indexRefreshTokens() {
    const exist = await this.users.indexExists(['exp_1', 'token_1']);
    if (!exist) {
      this.refresh_tokens.createIndex({ token: 1 }, { unique: true });
      this.refresh_tokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 });
    }
  }

  async indexFollowers() {
    const exist = await this.followers.indexExists(['user_id_1_followed_user_id_1']);
    if (!exist) {
      this.followers.createIndex({ user_id: 1, followed_user_id: 1 });
    }
  }

  async indexVideoStatus() {
    const exist = await this.videoStatus.indexExists(['name_1']);
    if (!exist) {
      this.videoStatus.createIndex({ name: 1 }, { unique: true });
    }
  }

  async indexHashtags() {
    const exist = await this.hashtags.indexExists(['name_1']);
    if (!exist) {
      this.hashtags.createIndex({ name: 1 }, { unique: true });
    }
  }

  async indexBookmarks() {
    const exist = await this.bookmarks.indexExists(['user_id_1_tweet_id_1']);
    if (!exist) {
      this.bookmarks.createIndex({ user_id: 1, tweet_id: 1 });
    }
  }

  async indexLikes() {
    const exist = await this.likes.indexExists(['user_id_1_tweet_id_1']);
    if (!exist) {
      this.likes.createIndex({ user_id: 1, tweet_id: 1 });
    }
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string);
  }

  get refresh_tokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string);
  }

  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_FOLLOWERS_COLLECTION as string);
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(process.env.DB_VIDEO_STATUS_COLLECTION as string);
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEETS_COLLECTION as string);
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(process.env.DB_HASHTAGS_COLLECTION as string);
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(process.env.DB_BOOKMARKS_COLLECTION as string);
  }

  get likes(): Collection<Like> {
    return this.db.collection(process.env.DB_LIKES_COLLECTION as string);
  }
}

const databaseService = new DatabaseService();
export default databaseService;
