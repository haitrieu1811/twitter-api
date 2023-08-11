import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import { BOOKMARKS_MESSAGES } from '~/constants/messages';
import { BookmarkTweetReqBody, UnbookmarkTweetReqParams } from '~/models/requests/Bookmark.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import bookmarksService from '~/services/bookmarks.services';

// Bookmark tweet
export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.body;
  const result = await bookmarksService.bookmarkTweet(tweet_id, user_id);
  return res.json({
    message: BOOKMARKS_MESSAGES.BOOKMARK_TWEET_SUCCEED,
    result
  });
};

// Unbookmark tweet
export const unbookmarkTweetController = async (req: Request<UnbookmarkTweetReqParams>, res: Response) => {
  const { tweet_id } = req.params;
  const { user_id } = req.decoded_authorization as TokenPayload;
  const result = await bookmarksService.unbookmarkTweet(tweet_id, user_id);
  return res.json({
    message: BOOKMARKS_MESSAGES.UN_BOOKMARK_TWEET_SUCCEED,
    result
  });
};
