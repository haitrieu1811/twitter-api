import { checkSchema } from 'express-validator';

import { validate } from '~/utils/validation';
import { userIdSchema } from './users.middlewares';

export const getConversationsValidator = validate(
  checkSchema(
    {
      receiver_id: userIdSchema
    },
    ['params']
  )
);
