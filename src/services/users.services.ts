import { ObjectId } from 'mongodb';
import { config } from 'dotenv';

import { TokenType } from '~/constants/enums';
import { RegisterReqBody } from '~/models/requests/User.request';
import User from '~/models/schemas/User.schema';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import databaseService from './database.services';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
config();
class UsersService {
  // Tạo một access token
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
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
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
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
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.data_of_birth),
        password: hashPassword(payload.password)
      })
    );
    const user_id = result.insertedId.toString();
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id);
    await this.insertRefreshToken({ user_id, refresh_token });
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

  // Kiểm tra một email đã tồn tại hay chưa
  async checkEmailExist(email: string) {
    const result = await databaseService.users.findOne({ email });
    return Boolean(result);
  }
}

const usersService = new UsersService();
export default usersService;
