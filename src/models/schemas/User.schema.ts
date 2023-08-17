import { ObjectId } from 'mongodb';
import { UserVerifyStatus } from '~/constants/enums';

interface UserType {
  _id?: ObjectId;
  name?: string;
  email: string;
  date_of_birth: Date;
  password: string;
  created_at?: Date;
  updated_at?: Date;
  email_verify_token?: string; // jwt hoặc '' nếu đã xác thực email
  forgot_password_token?: string; // jwt hoặc '' nếu đã xác thực email
  verify?: UserVerifyStatus;
  twitter_circle?: string[];

  bio?: string; // optional
  location?: string; // optional
  website?: string; // optional
  username?: string; // optional
  avatar?: string; // optional
  cover_photo?: string; // optional
}

export default class User {
  _id?: ObjectId;
  name?: string;
  email: string;
  date_of_birth: Date;
  password: string;
  created_at?: Date;
  updated_at?: Date;
  email_verify_token?: string; // jwt hoặc '' nếu đã xác thực email
  forgot_password_token?: string; // jwt hoặc '' nếu đã xác thực email
  verify?: UserVerifyStatus;
  twitter_circle: ObjectId[];

  bio?: string; // optional
  location?: string; // optional
  website?: string; // optional
  username?: string; // optional
  avatar?: string; // optional
  cover_photo?: string; // optional

  constructor({
    _id,
    name,
    email,
    date_of_birth,
    password,
    created_at,
    updated_at,
    email_verify_token,
    forgot_password_token,
    verify,
    twitter_circle,
    bio,
    location,
    website,
    username,
    avatar,
    cover_photo
  }: UserType) {
    const date = new Date();

    this._id = _id;
    this.name = name || '';
    this.email = email || '';
    this.date_of_birth = date_of_birth || new Date();
    this.password = password || '';
    this.created_at = created_at || date;
    this.updated_at = updated_at || date;
    this.email_verify_token = email_verify_token || '';
    this.forgot_password_token = forgot_password_token || '';
    this.verify = verify || UserVerifyStatus.Unverified;
    this.twitter_circle = twitter_circle ? twitter_circle.map((item) => new ObjectId(item)) : [];

    this.bio = bio || '';
    this.location = location || '';
    this.website = website || '';
    this.username = username || '';
    this.avatar = avatar || '';
    this.cover_photo = cover_photo || '';
  }
}
