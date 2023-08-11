import { ObjectId } from 'mongodb';
import databaseService from './database.services';
import Like from '~/models/schemas/Like.schema';

class LikesService {
  // Like tweet
  async likeTweet(tweet_id: string, user_id: string) {
    const result = await databaseService.likes.findOneAndUpdate(
      {
        tweet_id: new ObjectId(tweet_id),
        user_id: new ObjectId(user_id)
      },
      {
        $setOnInsert: new Like({
          tweet_id,
          user_id
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
    return result.value;
  }

  // Unlike tweet
  async unlikeTweet(tweet_id: string, user_id: string) {
    const result = await databaseService.likes.deleteOne({
      tweet_id: new ObjectId(tweet_id),
      user_id: new ObjectId(user_id)
    });
    return;
  }
}

const likesService = new LikesService();
export default likesService;
