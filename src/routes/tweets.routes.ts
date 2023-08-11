import { Router } from 'express';

import {
  createTweetController,
  getNewFeedsController,
  getTweetChildrenController,
  getTweetController
} from '~/controllers/tweets.controller';
import { filterMiddleware } from '~/middlewares/common.middlewares';
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator,
  tweetIdValidator
} from '~/middlewares/tweets.middlewares';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { TweetRequestBody } from '~/models/requests/Tweet.requests';
import { wrapRequestHandler } from '~/utils/handlers';
import { isUserLoggedInValidator } from '~/middlewares/users.middlewares';

const tweetsRouter = Router();

// Tạo tweet
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  filterMiddleware<TweetRequestBody>(['audience', 'content', 'hashtags', 'medias', 'mentions', 'parent_id', 'type']),
  wrapRequestHandler(createTweetController)
);

// Lấy danh sách newfeed
tweetsRouter.get(
  '/new-feeds',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedsController)
);

// Lấy chi tiết tweet
tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
);

// Lấy các tweet con (retweet, comment, quotetweet)
tweetsRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  paginationValidator,
  getTweetChildrenValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
);

export default tweetsRouter;
