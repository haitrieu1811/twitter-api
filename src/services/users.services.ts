import { config } from 'dotenv';
import { ObjectId } from 'mongodb';

import { TokenType, UserVerifyStatus } from '~/constants/enums';
import { USERS_MESSAGES } from '~/constants/messages';
import { RegisterReqBody } from '~/models/requests/User.request';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import User from '~/models/schemas/User.schema';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import databaseService from './database.services';
config();
class UsersService {
  // Tạo một access token
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    });
  }

  // Tạo một refresh token
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    });
  }

  // Tạo một email verify token
  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        toke_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.VERIFY_EMAIL_TOKEN_EXPIRES_IN
      }
    });
  }

  // Tạo một forgot password token
  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    });
  }

  // Tạo cùng lúc access token và refresh token
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)]);
  }

  // Thêm một refresh token vào collection `refresh_tokens`
  private insertRefreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    return databaseService.refresh_tokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    );
  }

  // Đăng kí
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId();
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString());
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        date_of_birth: new Date(payload.data_of_birth),
        password: hashPassword(payload.password),
        email_verify_token
      })
    );
    console.log('email_verify_token: ', email_verify_token);

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString());
    await this.insertRefreshToken({ user_id: user_id.toString(), refresh_token });
    return {
      access_token,
      refresh_token
    };
  }

  // Đăng nhập
  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id);
    await this.insertRefreshToken({ user_id, refresh_token });
    return {
      access_token,
      refresh_token
    };
  }

  // Đăng xuất
  async logout(refresh_token: string) {
    await databaseService.refresh_tokens.deleteOne({ token: refresh_token });
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    };
  }

  // Verify email
  async verifyEmail(user_id: string) {
    const [[access_token, refresh_token]] = await Promise.all([
      this.signAccessAndRefreshToken(user_id),
      databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: { email_verify_token: '', verify: UserVerifyStatus.Verified },
          $currentDate: { updated_at: true }
        }
      )
    ]);
    return {
      access_token,
      refresh_token
    };
  }

  // Gửi lại email verify token
  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken(user_id);
    // Gửi email
    console.log('Resend verify email with token: ', email_verify_token);

    // Cập nhật lại email verify token
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    );
    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    };
  }

  // Forgot password
  async forgotPassword(user_id: string) {
    const forgot_password_token = await this.signForgotPasswordToken(user_id);
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    );
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    };
  }

  // Kiểm tra một email đã tồn tại hay chưa
  async checkEmailExist(email: string) {
    const result = await databaseService.users.findOne({ email });
    return Boolean(result);
  }
}

const usersService = new UsersService();
export default usersService;
