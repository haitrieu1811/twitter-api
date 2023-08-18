import axios from 'axios';
import { ObjectId } from 'mongodb';

import { TokenType, UserVerifyStatus } from '~/constants/enums';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests';
import Follower from '~/models/schemas/Follower.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import User from '~/models/schemas/User.schema';
import { hashPassword } from '~/utils/crypto';
import { sendForgotPasswordEmail, sendVerifyEmail } from '~/utils/email';
import { signToken, verifyToken } from '~/utils/jwt';
import databaseService from './database.services';
import { ENV_CONFIG } from '~/constants/config';
class UsersService {
  // Tạo access token
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: ENV_CONFIG.JWT_SECRET_ACCESS_TOKEN,
      options: {
        expiresIn: ENV_CONFIG.ACCESS_TOKEN_EXPIRES_IN
      }
    });
  }

  // Tạo refresh token
  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: ENV_CONFIG.JWT_SECRET_REFRESH_TOKEN
      });
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: ENV_CONFIG.JWT_SECRET_REFRESH_TOKEN,
      options: {
        expiresIn: ENV_CONFIG.REFRESH_TOKEN_EXPIRES_IN
      }
    });
  }

  // Tạo email verify token
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        toke_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: ENV_CONFIG.JWT_SECRET_EMAIL_VERIFY_TOKEN,
      options: {
        expiresIn: ENV_CONFIG.VERIFY_EMAIL_TOKEN_EXPIRES_IN
      }
    });
  }

  // Tạo forgot password token
  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: ENV_CONFIG.JWT_SECRET_FORGOT_PASSWORD_TOKEN,
      options: {
        expiresIn: ENV_CONFIG.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    });
  }

  // Tạo access và refresh token
  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })]);
  }

  // Thêm một refresh token vào DB
  private insertRefreshToken({
    user_id,
    refresh_token,
    iat,
    exp
  }: {
    user_id: string;
    refresh_token: string;
    iat: number;
    exp: number;
  }) {
    return databaseService.refresh_tokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    );
  }

  // Đăng ký
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
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        email_verify_token
      })
    );
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    });
    const { iat, exp } = await this.decodeRefreshToken(refresh_token);
    await this.insertRefreshToken({ user_id: user_id.toString(), refresh_token, iat, exp });
    // Gửi mail verify cho email vừa đăng ký
    try {
      await sendVerifyEmail(payload.email, email_verify_token);
    } catch (error) {
      console.log(error);
    }
    return {
      access_token,
      refresh_token
    };
  }

  // Đăng nhập
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify });
    const { iat, exp } = await this.decodeRefreshToken(refresh_token);
    await this.insertRefreshToken({ user_id, refresh_token, iat, exp });
    return {
      access_token,
      refresh_token
    };
  }

  // Lấy oauth Google token
  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: ENV_CONFIG.GOOGLE_CLIENT_ID,
      client_secret: ENV_CONFIG.GOOGLE_CLIENT_SECRET,
      redirect_uri: ENV_CONFIG.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    };
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return data as {
      access_token: string;
      id_token: string;
    };
  }

  // Lấy thông tin user đăng ký bằng email trên Google
  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    });
    return data as {
      id: string;
      email: string;
      verified_email: boolean;
      name: string;
      given_name: string;
      family_name: string;
      picture: string;
      locale: string;
    };
  }

  // Đăng nhập bằng Google
  async oauth(code: string) {
    const { access_token, id_token } = await this.getOauthGoogleToken(code);
    const userInfo = await this.getGoogleUserInfo(access_token, id_token);
    // Kiểm tra đã xác thực email chưa
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }
    // Kiểm tra email có tồn tại trên hệ thống chưa
    const user = await databaseService.users.findOne({ email: userInfo.email });
    // Nếu đã tồn tại - cho đăng nhập
    if (user) {
      const data = await this.login({
        user_id: user._id.toString(),
        verify: user.verify as UserVerifyStatus
      });
      return {
        ...data,
        new_user: 0,
        verify: user.verify
      };
    } else {
      // Nếu chưa tồn tại - tạo mới tài khoản
      const password = Math.random().toString(36).substring(2, 15);
      const data = await this.register({
        name: userInfo.name,
        email: userInfo.email,
        password,
        confirm_password: password,
        date_of_birth: new Date().toISOString()
      });
      return {
        ...data,
        new_user: 1,
        verify: UserVerifyStatus.Unverified
      };
    }
  }

  // Đăng xuất
  async logout(refresh_token: string) {
    await databaseService.refresh_tokens.deleteOne({ token: refresh_token });
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    };
  }

  // Giải mã refresh token
  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: ENV_CONFIG.JWT_SECRET_REFRESH_TOKEN
    });
  }

  // Refresh token
  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    refresh_token: string;
    exp: number;
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refresh_tokens.deleteOne({
        token: refresh_token
      })
    ]);
    const decoded_refresh_token = await this.decodeRefreshToken(new_refresh_token);
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        token: new_refresh_token,
        user_id: new ObjectId(user_id),
        iat: decoded_refresh_token.iat,
        exp: decoded_refresh_token.exp
      })
    );
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    };
  }

  // Xác thực email
  async verifyEmail({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [[access_token, refresh_token]] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify }),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ]);
    const { iat, exp } = await this.decodeRefreshToken(refresh_token);
    await this.insertRefreshToken({ user_id, refresh_token, iat, exp });
    return {
      access_token,
      refresh_token
    };
  }

  // Gửi lại email xác thực có chứa email verify token
  async resendVerifyEmail(user_id: string, email: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified });
    // Gửi email
    await sendVerifyEmail(email, email_verify_token);
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

  // Quên mật khẩu
  async forgotPassword({ user_id, verify, email }: { user_id: string; verify: UserVerifyStatus; email: string }) {
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
    // Gửi mail
    await sendForgotPasswordEmail(email, forgot_password_token);
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    };
  }

  // Khôi phục mật khẩu
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

  // Lấy thông tin tài khoản đang đăng nhập
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

  // Kiểm tra một email có tồn tại chưa
  async checkEmailExist(email: string) {
    const result = await databaseService.users.findOne({ email });
    return Boolean(result);
  }

  // Cập nhật thông tin tài khoản đang đăng nhập
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

  // Lấy thông tin tài khoản khác qua tên đăng nhập
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

  // Kiểm tra một tài khoản đã follow một tài khoản khác chưa
  async checkFollowerExist({ user_id, followed_user_id }: { user_id: string; followed_user_id: string }) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });
    return Boolean(follower);
  }

  // Follow người dùng
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

  // Bỏ follow người dùng
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

  // Đổi mật khẩu
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
