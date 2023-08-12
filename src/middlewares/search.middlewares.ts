import { checkSchema } from 'express-validator';

import { MediaQueryType, PeopleCircle } from '~/constants/enums';
import { SEARCH_MESSAGES } from '~/constants/messages';
import { validate } from '~/utils/validation';

// Tìm kiếm
export const searchValidator = validate(
  checkSchema(
    {
      q: {
        notEmpty: {
          errorMessage: SEARCH_MESSAGES.KEYWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: SEARCH_MESSAGES.KEYWORD_MUST_BE_A_STRING
        }
      },
      k: {
        optional: true,
        isIn: {
          options: [Object.values(MediaQueryType)],
          errorMessage: SEARCH_MESSAGES.MEDIA_TYPE_IS_INVALID
        }
      },
      pf: {
        optional: true,
        isIn: {
          options: [Object.values(PeopleCircle)],
          errorMessage: SEARCH_MESSAGES.PEOPLE_FOLLOWED_IS_INVALID
        }
      }
    },
    ['query']
  )
);
