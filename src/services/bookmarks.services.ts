import { ObjectId } from 'mongodb';

import Bookmark from '~/models/schemas/Bookmark.schema';
import databaseService from './database.services';

class BookmarksService {
  // Bookmark tweet
  async bookmarkTweet(tweet_id: string, user_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      {
        tweet_id: new ObjectId(tweet_id),
        user_id: new ObjectId(user_id)
      },
      {
        $setOnInsert: new Bookmark({
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

  // Unbookmark tweet
  async unbookmarkTweet(tweet_id: string, user_id: string) {
    await databaseService.bookmarks.deleteOne({
      tweet_id: new ObjectId(tweet_id),
      user_id: new ObjectId(user_id)
    });
    return;
  }
}

const bookmarksService = new BookmarksService();
export default bookmarksService;
