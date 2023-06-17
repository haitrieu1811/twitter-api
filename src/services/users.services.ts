import User from '~/models/schemas/User.schema';
import databaseService from './database.services';

class UsersService {
  async register(user: { email: string; password: string }) {
    const result = await databaseService.users.insertOne(new User(user));
    return result;
  }
}

const usersService = new UsersService();
export default usersService;
