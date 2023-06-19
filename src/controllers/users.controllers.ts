import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';

import { USERS_MESSAGE } from '~/constants/messages';
import { RegisterReqBody } from '~/models/requests/User.request';
import User from '~/models/schemas/User.schema';
import usersService from '~/services/users.services';

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const result = await usersService.login(user_id.toString());
  return res.json({
    message: USERS_MESSAGE.LOGIN_SUCCESS,
    result
  });
};

export const registerController = (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = usersService.register(req.body);
  return res.json({
    message: USERS_MESSAGE.REGISTER_SUCCESS,
    result
  });
};
