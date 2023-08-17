import { NextFunction, Request, Response } from 'express';
import { checkSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import capitalize from 'lodash/capitalize';
import pick from 'lodash/pick';

import HTTP_STATUS from '~/constants/httpStatus';
import { TWEETS_MESSAGES, USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validation';

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

// Xác minh access token
export const verifyAccessToken = async (access_token: string, req?: Request) => {
  if (!access_token) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
  try {
    const decoded_authorization = await verifyToken({
      token: access_token,
      secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    });
    if (req) {
      (req as Request).decoded_authorization = decoded_authorization;
      return true;
    }
    return decoded_authorization;
  } catch (error) {
    throw new ErrorWithStatus({
      message: capitalize((error as JsonWebTokenError).message),
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
};
