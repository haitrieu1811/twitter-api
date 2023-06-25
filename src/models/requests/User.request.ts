import { JwtPayload } from 'jsonwebtoken';
import { UserVerifyStatus } from '~/constants/enums';

export interface RegisterReqBody {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  data_of_birth: string;
}

export interface LogoutReqBody {
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

export interface TokenPayload extends JwtPayload {
  user_id: string;
  token_type: string;
  verify: UserVerifyStatus;
}
