import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import { LIKES_MESSAGES } from '~/constants/messages';
import { LikeTweetReqBody, UnlikeTweetReqParams } from '~/models/requests/Like.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import likesService from '~/services/likes.services';

// Like tweet
export const likeTweetController = async (req: Request<ParamsDictionary, any, LikeTweetReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.body;
  const result = await likesService.likeTweet(tweet_id, user_id);
  return res.json({
    message: LIKES_MESSAGES.LIKE_TWEET_SUCCEED,
    result
  });
};

// Unlike tweet
export const unlikeTweetController = async (req: Request<UnlikeTweetReqParams>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.params;
  const result = await likesService.unlikeTweet(tweet_id, user_id);
  return res.json({
    message: LIKES_MESSAGES.UN_LIKE_TWEET_SUCCEED,
    result
  });
};
