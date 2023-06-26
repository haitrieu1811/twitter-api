import { Router } from 'express';
import {
  changePasswordController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  unfollowController,
  updateMeController,
  verifyEmailTokenController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers';
import { filterMiddleware } from '~/middlewares/common.middlewares';
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares';
import { UpdateMeReqBody } from '~/models/requests/User.request';
import { wrapRequestHandler } from '~/utils/handlers';

const usersRouter = Router();

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController));
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController));
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController));
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(verifyEmailTokenController));
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendEmailVerifyController));
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController));
usersRouter.post(
  '/verify-forgot-password-token',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordTokenController)
);
usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController));
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController));
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    'avatar',
    'bio',
    'cover_photo',
    'date_of_birth',
    'location',
    'name',
    'username',
    'website'
  ]),
  wrapRequestHandler(updateMeController)
);
usersRouter.get('/:username', wrapRequestHandler(getProfileController));
usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
);
usersRouter.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
);
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
);

export default usersRouter;
