import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import { SEARCH_MESSAGES } from '~/constants/messages';
import { SearchQuery } from '~/models/requests/Search.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import searchService from '~/services/search.services';

// Tìm kiếm
export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweets, total, page, limit, page_size } = await searchService.search({
    ...req.query,
    user_id
  });
  return res.json({
    message: SEARCH_MESSAGES.SEARCH_SUCCEED,
    result: {
      tweets,
      pagination: {
        total,
        page,
        limit,
        page_size
      }
    }
  });
};
