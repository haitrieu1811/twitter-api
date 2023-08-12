import { ObjectId } from 'mongodb';

import { MediaQueryType, MediaType, PeopleCircle, TweetAudience, TweetType } from '~/constants/enums';
import { SearchQuery } from '~/models/requests/Search.requests';
import databaseService from './database.services';

class SearchService {
  // Tìm kiếm
  async search({ user_id, page, limit, q, k, pf }: SearchQuery & { user_id: string }) {
    // Phân trang
    const _page = page ? Number(page) : 1;
    const _limit = limit ? Number(limit) : 20;
    // Lọc kết quả tìm kiếm
    const $match: any = {
      $text: {
        $search: q
      }
    };
    // Lọc theo media (hình ảnh, video)
    if (k) {
      if (k === MediaQueryType.Image) {
        $match['medias.type'] = MediaType.Image;
      } else if (k === MediaQueryType.Video) {
        $match['medias.type'] = {
          $in: [MediaType.Video, MediaType.HLS]
        };
      }
    }
    // Lọc theo tất cả mọi người hay chỉ những người mà mình follow
    if (pf && pf === PeopleCircle.Following) {
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
      _followed_ids.push(new ObjectId(user_id));
      $match.user_id = {
        $in: _followed_ids
      };
    }
    // Truy vấn lấy danh sách và tổng kết quả tìm kiếm
    const [tweets, total_arr] = await Promise.all([
      databaseService.tweets
        .aggregate([
          {
            $match
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
                  audience: TweetAudience.Everyone
                },
                {
                  $and: [
                    {
                      audience: TweetAudience.TwitterCircle
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
          },
          {
            $skip: (_page - 1) * _limit
          },
          {
            $limit: _limit
          }
        ])
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match
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
                  audience: TweetAudience.Everyone
                },
                {
                  $and: [
                    {
                      audience: TweetAudience.TwitterCircle
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
            $count: 'total'
          }
        ])
        .toArray()
    ]);
    const total = total_arr.length > 0 ? (total_arr[0].total as number) : 0;
    // Tăng view sau khi tìm kiếm thành công
    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId);
    const updated_time = new Date();
    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweet_ids
        }
      },
      {
        $inc: {
          user_views: 1
        },
        $set: {
          updated_at: updated_time
        }
      }
    );
    tweets.forEach((tweet) => {
      tweet.updated_at = updated_time;
      tweet.user_views += 1;
    });
    return {
      tweets,
      total,
      page: _page,
      limit: _limit,
      page_size: Math.ceil(total / _limit)
    };
  }
}

const searchService = new SearchService();
export default searchService;
