import { JwtPayload } from 'jsonwebtoken';
import { UserVerifyStatus } from '~/constants/enums';
import { ParamsDictionary } from 'express-serve-static-core';

export interface RegisterReqBody {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  date_of_birth: string;
}

export interface LogoutReqBody {
  refresh_token: string;
}

export interface RefreshTokenReqBody {
  refresh_token: string;
}

export interface ResetPasswordReqBody {
  password: string;
  confirm_password: string;
}

export interface UpdateMeReqBody {
  name?: string;
  date_of_birth?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  cover_photo?: string;
}

export interface FollowReqBody {
  followed_user_id: string;
}

export interface UnFollowReqParams extends ParamsDictionary {
  user_id: string;
}

export interface GetProfileReqParams extends ParamsDictionary {
  username: string;
}

export interface ChangePasswordReqBody {
  old_password: string;
  password: string;
  confirm_password: string;
}

export interface TokenPayload extends JwtPayload {
  user_id: string;
  token_type: string;
  verify: UserVerifyStatus;
  iat: number;
  exp: number;
}
