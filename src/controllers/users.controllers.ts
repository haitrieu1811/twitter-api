import { Request, Response } from 'express';

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
