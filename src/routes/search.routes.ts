import { Router } from 'express';

import { searchController } from '~/controllers/search.controllers';
import { paginationValidator } from '~/middlewares/common.middlewares';
import { searchValidator } from '~/middlewares/search.middlewares';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const searchRouter = Router();

// Tìm kiếm
searchRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  searchValidator,
  wrapRequestHandler(searchController)
);

export default searchRouter;
