import { Router } from 'express';
import {
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  verifyEmailTokenController
} from '~/controllers/users.controllers';
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const usersRouter = Router();

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController));
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController));
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController));
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(verifyEmailTokenController));
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendEmailVerifyController));
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController));

export default usersRouter;
