import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { UserVerifyStatus } from '~/constants/enums';
import HTTP_STATUS from '~/constants/httpStatus';

import { USERS_MESSAGES } from '~/constants/messages';
import { LogoutReqBody, RegisterReqBody, ResetPasswordReqBody, TokenPayload } from '~/models/requests/User.request';
import User from '~/models/schemas/User.schema';
import databaseService from '~/services/database.services';
import usersService from '~/services/users.services';

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const result = await usersService.login(user_id.toString());
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  });
};

export const registerController = (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = usersService.register(req.body);
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  });
};

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body;
  const result = await usersService.logout(refresh_token);
  return res.json(result);
};

export const verifyEmailTokenController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload;
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  });
  // Không tìm thấy user
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    });
  }
  // Tài khoản đã được verify trước đó
  if (user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    });
  }
  // Nếu chưa verify
  const result = await usersService.verifyEmail(user_id);
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  });
};

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    });
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    });
  }
  const result = await usersService.resendVerifyEmail(user_id);
  return res.json(result);
};

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  const { email } = req.body;
  const user = await databaseService.users.findOne({ email });
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    });
  }
  const result = await usersService.forgotPassword(user._id.toString());
  return res.json(result);
};
