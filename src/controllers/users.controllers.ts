import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import { RegisterReqBody } from '~/models/requests/User.request';
import usersService from '~/services/users.services';

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'haitrieu2524@gmail.com' && password === '123456') {
    return res.json({
      message: 'Login Success'
    });
  }
  return res.status(200).json({
    message: 'Login Fail'
  });
};

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    const result = await usersService.register(req.body);
    return res.json({
      message: 'Register Success',
      result
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Register Fail',
      error
    });
  }
};
