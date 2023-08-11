import { ObjectId, WithId } from 'mongodb';

import { TweetType } from '~/constants/enums';
import { TweetPagination, TweetReqQuery, TweetRequestBody } from '~/models/requests/Tweet.requests';
import Hashtag from '~/models/schemas/Hashtag.schema';
import Tweet from '~/models/schemas/Tweet.schema';
import databaseService from './database.services';

class TweetsService {
  // Kiểm tra và tạo mới các hashtag khi chưa tồn tại
  async checkAndCreateHashtag(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) =>
        databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          {
            $setOnInsert: new Hashtag({ name: hashtag })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      )
    );
    const _hashtagDocuments = hashtagDocuments.map((hashtagDocument) =>
      (hashtagDocument.value as WithId<Hashtag>)._id.toString()
    );
    return _hashtagDocuments;
  }

  // Tạo tweet
  async createTweet(body: TweetRequestBody, user_id: string) {
    const hashtags = await this.checkAndCreateHashtag(body.hashtags);
    const { insertedId } = await databaseService.tweets.insertOne(
      new Tweet({
        ...body,
        hashtags,
        user_id: new ObjectId(user_id)
      })
    );
    const tweet = await databaseService.tweets.findOne({ _id: insertedId });
    return tweet;
  }

  // Tăng view khi get tweet
  async increaseTweetView(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 };
    const result = await databaseService.tweets.findOneAndUpdate(
      {
        _id: new ObjectId(tweet_id)
      },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1
        }
      }
    );
    return result.value as WithId<{
      guest_views: number;
      user_views: number;
    }>;
  }

  // Lấy các tweet con (retweet, comment, quotetweet)
  async getTweetChildren({
    page,
    limit,
    tweet_type,
    tweet_id,
    user_id
  }: TweetReqQuery & { tweet_id: string; user_id?: string }) {
    // Phân trang
    const _page = page ? Number(page) : 1;
    const _limit = limit ? Number(limit) : 10;
    // Lọc tweet
    const filter = {
      parent_id: new ObjectId(tweet_id),
      type: Number(tweet_type)
    };
    // Tính tổng tweet và lấy danh sách tweet
    const [total_tweets, tweets] = await Promise.all([
      databaseService.tweets.countDocuments(filter),
      databaseService.tweets
        .aggregate<Tweet>([
          {
            $match: filter
          },
          {
            $lookup: {
              from: 'hashtags',
              localField: 'hashtags',
              foreignField: '_id',
              as: 'hashtags'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'mentions',
              foreignField: '_id',
              as: 'mentions'
            }
          },
          {
            $lookup: {
              from: 'bookmarks',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'bookmark_count'
            }
          },
          {
            $lookup: {
              from: 'likes',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'like_count'
            }
          },
          {
            $lookup: {
              from: 'tweets',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'tweet_childs'
            }
          },
          {
            $addFields: {
              mentions: {
                $map: {
                  input: '$mentions',
                  as: 'mention',
                  in: {
                    _id: '$$mention._id',
                    name: '$$mention.name',
                    email: '$$mention.email'
                  }
                }
              },
              bookmark_count: {
                $size: '$bookmark_count'
              },
              like_count: {
                $size: '$like_count'
              },
              retweet_count: {
                $size: {
                  $filter: {
                    input: '$tweet_childs',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', 1]
                    }
                  }
                }
              },
              comment_count: {
                $size: {
                  $filter: {
                    input: '$tweet_childs',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', 2]
                    }
                  }
                }
              },
              quote_tweet_count: {
                $size: {
                  $filter: {
                    input: '$tweet_childs',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', 3]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              tweet_childs: 0
            }
          },
          {
            $skip: (_page - 1) * _limit
          },
          {
            $limit: _limit
          }
        ])
        .toArray()
    ]);
    // Tăng view tweet
    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId);
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 };
    const updated_time = new Date();
    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweet_ids
        }
      },
      {
        $inc: inc,
        $set: {
          updated_at: updated_time
        }
      }
    );
    tweets.forEach((tweet) => {
      if (user_id) tweet.user_views += 1;
      else tweet.guest_views += 1;
      tweet.updated_at = updated_time;
    });
    return {
      tweets,
      total: total_tweets,
      page: _page,
      limit: _limit,
      page_size: Math.ceil(total_tweets / _limit)
    };
  }

  // Lấy danh sách newfeed
  async getNewFeeds({ page, limit, user_id }: TweetPagination & { user_id: string }) {
    // Lấy danh sách user_id đang theo dõi
    const followed_ids = await databaseService.followers
      .find(
        {
          user_id: new ObjectId(user_id)
        },
        {
          projection: {
            followed_user_id: 1,
            _id: 0
          }
        }
      )
      .toArray();
    const _followed_ids = followed_ids.map((item) => item.followed_user_id);
    _followed_ids.push(new ObjectId(user_id)); // Hiển thị luôn cả tweet của mình
    // Phân trang
    const _page = page ? Number(page) : 1;
    const _limit = limit ? Number(limit) : 20;
    const [tweets, total_arr] = await Promise.all([
      databaseService.tweets
        .aggregate([
          {
            $match: {
              user_id: {
                $in: _followed_ids
              }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [new ObjectId(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $skip: (_page - 1) * _limit
          },
          {
            $limit: _limit
          },
          {
            $lookup: {
              from: 'hashtags',
              localField: 'hashtags',
              foreignField: '_id',
              as: 'hashtags'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'mentions',
              foreignField: '_id',
              as: 'mentions'
            }
          },
          {
            $lookup: {
              from: 'bookmarks',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'bookmark_count'
            }
          },
          {
            $lookup: {
              from: 'likes',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'like_count'
            }
          },
          {
            $lookup: {
              from: 'tweets',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'tweet_childs'
            }
          },
          {
            $addFields: {
              mentions: {
                $map: {
                  input: '$mentions',
                  as: 'mention',
                  in: {
                    _id: '$$mention._id',
                    name: '$$mention.name',
                    email: '$$mention.email'
                  }
                }
              },
              bookmark_count: {
                $size: '$bookmark_count'
              },
              like_count: {
                $size: '$like_count'
              },
              retweet_count: {
                $size: {
                  $filter: {
                    input: '$tweet_childs',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Retweet]
                    }
                  }
                }
              },
              comment_count: {
                $size: {
                  $filter: {
                    input: '$tweet_childs',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Comment]
                    }
                  }
                }
              },
              quote_tweet_count: {
                $size: {
                  $filter: {
                    input: '$tweet_childs',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.QuoteTweet]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              tweet_childs: 0,
              parent_id: 0,
              user_id: 0,
              user: {
                password: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                date_of_birth: 0,
                twitter_circle: 0,
                verify: 0
              }
            }
          }
        ])
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match: {
              $and: [
                {
                  user_id: {
                    $in: _followed_ids
                  }
                },
                {
                  $or: [
                    {
                      audience: 0
                    },
                    {
                      $and: [
                        {
                          audience: 1
                        },
                        {
                          'user.twitter_circle': {
                            $in: [new ObjectId(user_id)]
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ]);
    // Tổng số lượng tweet
    const total = total_arr[0].total as number;
    // Tăng view cho các tweet có trong new feeds
    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId);
    const updated_time = new Date();
    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweet_ids
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: updated_time
        }
      }
    );
    tweets.forEach((tweet) => {
      tweet.user_views += 1;
      tweet.updated_at = updated_time;
    });
    return {
      tweets,
      page: _page,
      limit: _limit,
      total,
      page_size: Math.ceil(total / _limit)
    };
  }
}

const tweetsService = new TweetsService();
export default tweetsService;
