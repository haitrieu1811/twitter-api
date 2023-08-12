import { NextFunction, Request, Response } from 'express';
import pick from 'lodash/pick';
import { checkSchema } from 'express-validator';

import { validate } from '~/utils/validation';
import { TWEETS_MESSAGES } from '~/constants/messages';

type FilterKeys<T> = Array<keyof T>;

// Lọc request body chỉ lấy những field mong muốn
export const filterMiddleware =
  <T>(filterKeys: FilterKeys<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys);
    next();
  };

// Phân trang
export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        optional: true,
        isNumeric: {
          errorMessage: TWEETS_MESSAGES.LIMIT_MUST_BE_A_NUMBER
        },
        custom: {
          options: (value) => {
            const limit = Number(value);
            if (limit > 100 || limit < 1) {
              throw new Error(TWEETS_MESSAGES.LIMIT_MUST_FROM_1_TO_100);
            }
            return true;
          }
        }
      },
      page: {
        optional: true,
        isNumeric: {
          errorMessage: TWEETS_MESSAGES.PAGE_MUST_BE_A_NUMBER
        },
        custom: {
          options: (value) => {
            const page = Number(value);
            if (page < 1) {
              throw new Error(TWEETS_MESSAGES.PAGE_MUST_FROM_1);
            }
            return true;
          }
        }
      }
    },
    ['query']
  )
);
