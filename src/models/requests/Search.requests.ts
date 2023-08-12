import { Query } from 'express-serve-static-core';

import { MediaQueryType, PeopleCircle } from '~/constants/enums';
import { Pagination } from './Common.requests';

// Tìm kiếm
export interface SearchQuery extends Pagination, Query {
  q: string;
  k?: MediaQueryType; // Media type
  pf?: PeopleCircle;
}
