import { NextFunction, Request, Response } from 'express';
import omit from 'lodash/omit';
import HTTP_STATUS from '~/constants/httpStatus';

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  return res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ['status']));
};
