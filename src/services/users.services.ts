import { config } from 'dotenv';
import { ObjectId } from 'mongodb';

import { TokenType, UserVerifyStatus } from '~/constants/enums';
import { USERS_MESSAGES } from '~/constants/messages';
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.request';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import User from '~/models/schemas/User.schema';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import databaseService from './database.services';
import Follower from '~/models/schemas/Follower.schema';
import { ErrorWithStatus } from '~/models/Errors';
import HTTP_STATUS from '~/constants/httpStatus';
config();
class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    });
  }

  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    });
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        toke_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.VERIFY_EMAIL_TOKEN_EXPIRES_IN
      }
    });
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    });
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })]);
  }

  private insertRefreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    return databaseService.refresh_tokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    );
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId();
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    });
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id}`,
        date_of_birth: new Date(payload.data_of_birth),
        password: hashPassword(payload.password),
        email_verify_token
      })
    );
    console.log('email_verify_token: ', email_verify_token);

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    });
    await this.insertRefreshToken({ user_id: user_id.toString(), refresh_token });
    return {
      access_token,
      refresh_token
    };
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify });
    await this.insertRefreshToken({ user_id, refresh_token });
    return {
      access_token,
      refresh_token
    };
  }

  async logout(refresh_token: string) {
    await databaseService.refresh_tokens.deleteOne({ token: refresh_token });
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    };
  }

  async verifyEmail({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [[access_token, refresh_token]] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify }),
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

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified });
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

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify });
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
    // Giả lập gửi email
    console.log('forgot_password_token:', forgot_password_token);
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    };
  }

  async resetPassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(new_password)
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

  async getMe(user_id: string) {
    const result = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    );
    return result;
  }

  async checkEmailExist(email: string) {
    const result = await databaseService.users.findOne({ email });
    return Boolean(result);
  }

  async updateMe({ payload, user_id }: { payload: UpdateMeReqBody; user_id: string }) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload;
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    );
    return user.value;
  }

  async getProfile(username: string) {
    const profile = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    );
    return profile;
  }

  async checkFollowerExist({ user_id, followed_user_id }: { user_id: string; followed_user_id: string }) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });
    return Boolean(follower);
  }

  async follow({ user_id, followed_user_id }: { user_id: string; followed_user_id: string }) {
    const isExist = await this.checkFollowerExist({ user_id, followed_user_id });
    if (!isExist) {
      await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      );
      return {
        message: USERS_MESSAGES.FOLLOW_SUCCESS
      };
    }
    return {
      message: USERS_MESSAGES.FOLLOWED
    };
  }

  async unfollow({ user_id, followed_user_id }: { user_id: string; followed_user_id: string }) {
    const isExist = await this.checkFollowerExist({ user_id, followed_user_id });
    if (isExist) {
      await databaseService.followers.deleteOne({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      });
      return {
        message: USERS_MESSAGES.UNFOLLOW_SUCCESS
      };
    }
    return {
      message: USERS_MESSAGES.ALREADY_UNFOLLOWED
    };
  }

  async changePassword({ password, user_id }: { password: string; user_id: string }) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    );
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    };
  }
}

const usersService = new UsersService();
export default usersService;
