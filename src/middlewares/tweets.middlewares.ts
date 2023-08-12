import { NextFunction, Request, Response } from 'express';
import { checkSchema } from 'express-validator';
import { ObjectId } from 'mongodb';

import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums';
import HTTP_STATUS from '~/constants/httpStatus';
import { TWEETS_MESSAGES, USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import { Media } from '~/models/Other';
import { TokenPayload } from '~/models/requests/User.requests';
import Tweet from '~/models/schemas/Tweet.schema';
import databaseService from '~/services/database.services';
import { numberEnumToArray } from '~/utils/commons';
import { wrapRequestHandler } from '~/utils/handlers';
import { validate } from '~/utils/validation';

const tweetTypes = numberEnumToArray(TweetType);
const TweetAudiences = numberEnumToArray(TweetAudience);
const mediaTypes = numberEnumToArray(MediaType);

// Tạo tweet
export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: TWEETS_MESSAGES.INVALID_TYPE
        }
      },
      audience: {
        isIn: {
          options: [TweetAudiences],
          errorMessage: TWEETS_MESSAGES.INVALID_AUDIENCE
        }
      },
      parent_id: {
        custom: {
          options: async (value, { req }) => {
            const type = req.body.type as TweetType;
            if (
              [TweetType.Retweet, TweetType.QuoteTweet, TweetType.Comment].includes(type) &&
              !ObjectId.isValid(value)
            ) {
              throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID);
            }
            if (type === TweetType.Tweet && value !== null) {
              throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_NULL);
            }
            return true;
          }
        }
      },
      hashtags: {
        isArray: {
          errorMessage: TWEETS_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY
        },
        custom: {
          options: (value: string[]) => {
            if (!value.every((item) => typeof item === 'string')) {
              throw new Error(TWEETS_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING);
            }
            return true;
          }
        }
      },
      mentions: {
        isArray: true,
        custom: {
          options: (value: string[]) => {
            if (!value.every((item) => ObjectId.isValid(item))) {
              throw new Error(TWEETS_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID);
            }
            return true;
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          options: (value: Media[]) => {
            const isValid = value.every((item) => typeof item.url !== 'string' || !mediaTypes.includes(item.type));
            if (!isValid) {
              throw new Error(TWEETS_MESSAGES.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT);
            }
            return true;
          }
        }
      },
      content: {
        isString: {
          errorMessage: TWEETS_MESSAGES.CONTENT_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType;
            const hashtags = req.body.hashtags as string[];
            const mentions = req.body.mentions as string[];
            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
              hashtags.length <= 0 &&
              mentions.length <= 0 &&
              value === ''
            ) {
              throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING);
            }
            if (type === TweetType.Retweet && value !== '') {
              throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_EMPTY_STRING);
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);

// Validate tweet_id
export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        notEmpty: {
          errorMessage: TWEETS_MESSAGES.TWEET_ID_IS_REQUIRED
        },
        isString: {
          errorMessage: TWEETS_MESSAGES.TWEET_ID_MUST_BE_A_STRING
        },
        custom: {
          options: async (value: string, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(TWEETS_MESSAGES.TWEET_ID_IS_INVALID);
            }
            const [tweet] = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
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
                    }
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
                    tweet_childs: 0
                  }
                }
              ])
              .toArray();
            if (!tweet) {
              throw new ErrorWithStatus({
                message: TWEETS_MESSAGES.TWEET_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              });
            }
            (req as Request).tweet = tweet;
            return true;
          }
        }
      }
    },
    ['params', 'body']
  )
);

// Audience middleware (kiểm tra quyền xem)
export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet;
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // Kiểm tra người xem tweet này đã đăng nhập hay chưa
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED
      });
    }
    const author = await databaseService.users.findOne({
      _id: tweet.user_id
    });
    // Kiểm tra tài khoản tác giả có bị khóa hay bị xóa không
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    // Kiểm tra người xem tweet này có trong Twitter circle của tác giả không
    const { user_id } = req.decoded_authorization as TokenPayload;
    const isInTwitterCircle = author.twitter_circle?.some((item) => item.equals(user_id));
    if (!isInTwitterCircle && !author._id.equals(user_id)) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.TWEET_IS_NOT_PUBLIC,
        status: HTTP_STATUS.FORBIDDEN
      });
    }
  }
  next();
});

// Lấy danh sách tweet con (children tweet)
export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: TWEETS_MESSAGES.TYPE_IS_INVALID
        }
      }
    },
    ['query']
  )
);
