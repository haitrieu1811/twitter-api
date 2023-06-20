import { JwtPayload } from 'jsonwebtoken';

export interface RegisterReqBody {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  data_of_birth: string;
}

export interface ResetPasswordReqBody {
  email: string;
}

export interface LogoutReqBody {
  refresh_token: string;
}

export interface TokenPayload extends JwtPayload {
  user_id: string;
  token_type: string;
}
