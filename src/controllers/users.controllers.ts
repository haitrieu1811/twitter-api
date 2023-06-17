import { Request, Response } from 'express';
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

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await usersService.register({ email, password });
    return res.json({
      message: 'Register Success',
      result
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: 'Register Fail',
      error
    });
  }
};
