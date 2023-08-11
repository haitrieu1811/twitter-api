import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import { TWEETS_MESSAGES } from '~/constants/messages';
import { TweetPagination, TweetReqParams, TweetReqQuery, TweetRequestBody } from '~/models/requests/Tweet.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import tweetsService from '~/services/tweets.services';

// Tạo tweet
export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const result = await tweetsService.createTweet(req.body, user_id);
  return res.json({
    message: TWEETS_MESSAGES.CREATE_TWEET_SUCCEED,
    result
  });
};

// Lấy chi tiết tweet
export const getTweetController = async (req: Request<TweetReqParams>, res: Response) => {
  const { tweet_id } = req.params;
  const { guest_views, user_views } = await tweetsService.increaseTweetView(
    tweet_id,
    req.decoded_authorization?.user_id
  );
  const tweet = {
    ...req.tweet,
    guest_views,
    user_views
  };
  return res.json({
    message: TWEETS_MESSAGES.GET_TWEET_SUCCEED,
    result: tweet
  });
};

// Lấy các tweet con (retweet, comment, quotetweet)
export const getTweetChildrenController = async (
  req: Request<TweetReqParams, any, any, TweetReqQuery>,
  res: Response
) => {
  const { page, limit, tweet_type } = req.query;
  const { tweet_id } = req.params;
  const user_id = req.decoded_authorization?.user_id;
  const result = await tweetsService.getTweetChildren({ tweet_id, page, limit, tweet_type, user_id });
  return res.json({
    message: TWEETS_MESSAGES.GET_TWEET_CHILDREN_SUCCEED,
    result: {
      tweets: result.tweets,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        page_size: result.page_size
      }
    }
  });
};

// Lấy danh sách new feeds
export const getNewFeedsController = async (
  req: Request<ParamsDictionary, any, any, TweetPagination>,
  res: Response
) => {
  const { page, limit } = req.query;
  const { user_id } = req.decoded_authorization as TokenPayload;
  const result = await tweetsService.getNewFeeds({ page, limit, user_id });
  return res.json({
    message: TWEETS_MESSAGES.GET_NEW_FEEDS_SUCCEED,
    result: {
      tweets: result.tweets,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        page_size: result.page_size
      }
    }
  });
};
