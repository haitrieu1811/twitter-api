import { Collection, Db, MongoClient } from 'mongodb';

import { ENV_CONFIG } from '~/constants/config';
import Bookmark from '~/models/schemas/Bookmark.schema';
import Conversation from '~/models/schemas/Conversation.schema';
import Follower from '~/models/schemas/Follower.schema';
import Hashtag from '~/models/schemas/Hashtag.schema';
import Like from '~/models/schemas/Like.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import Tweet from '~/models/schemas/Tweet.schema';
import User from '~/models/schemas/User.schema';
import VideoStatus from '~/models/schemas/VideoStatus.schema';

const uri = `mongodb+srv://${ENV_CONFIG.DB_USERNAME}:${ENV_CONFIG.DB_PASSWORD}@twitter.pesqzad.mongodb.net/?retryWrites=true&w=majority`;

class DatabaseService {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(ENV_CONFIG.DB_NAME);
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

  async indexTweets() {
    const exist = await this.tweets.indexExists(['content_text']);
    if (!exist) {
      this.tweets.createIndex({ content: 'text' }, { default_language: 'none' });
    }
  }

  get users(): Collection<User> {
    return this.db.collection(ENV_CONFIG.DB_USERS_COLLECTION);
  }

  get refresh_tokens(): Collection<RefreshToken> {
    return this.db.collection(ENV_CONFIG.DB_REFRESH_TOKENS_COLLECTION);
  }

  get followers(): Collection<Follower> {
    return this.db.collection(ENV_CONFIG.DB_FOLLOWERS_COLLECTION);
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(ENV_CONFIG.DB_VIDEO_STATUS_COLLECTION);
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(ENV_CONFIG.DB_TWEETS_COLLECTION);
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(ENV_CONFIG.DB_HASHTAGS_COLLECTION);
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(ENV_CONFIG.DB_BOOKMARKS_COLLECTION);
  }

  get likes(): Collection<Like> {
    return this.db.collection(ENV_CONFIG.DB_LIKES_COLLECTION);
  }

  get conversations(): Collection<Conversation> {
    return this.db.collection(ENV_CONFIG.DB_CONVERSATIONS_COLLECTION);
  }
}

const databaseService = new DatabaseService();
export default databaseService;
