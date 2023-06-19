import { checkSchema } from 'express-validator';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGE } from '~/constants/messages';
import { ErrorWithMessage } from '~/models/Errors';
import databaseService from '~/services/database.services';
import usersService from '~/services/users.services';
import { hashPassword } from '~/utils/crypto';
import { validate } from '~/utils/validation';

export const loginValidator = validate(
  checkSchema({
    email: {
      notEmpty: {
        errorMessage: USERS_MESSAGE.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USERS_MESSAGE.EMAIL_IS_INVALID
      },
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({ email: value, password: hashPassword(req.body.password) });
          if (user === null) {
            throw new ErrorWithMessage({
              message: USERS_MESSAGE.EMAIL_OR_PASSWORD_IS_INCORRECT,
              status: HTTP_STATUS.UNAUTHORIZED
            });
          }
          req.user = user;
          return true;
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: USERS_MESSAGE.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGE.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USERS_MESSAGE.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USERS_MESSAGE.PASSWORD_MUST_BE_STRONG
      }
    }
  })
);

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: USERS_MESSAGE.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGE.NAME_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 1,
          max: 100
        },
        errorMessage: USERS_MESSAGE.NAME_LENGTH_MUST_BE_FROM_1_TO_100
      },
      trim: true
    },
    email: {
      notEmpty: {
        errorMessage: USERS_MESSAGE.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USERS_MESSAGE.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value) => {
          const isEmailExist = await usersService.checkEmailExist(value);
          if (isEmailExist) {
            throw new ErrorWithMessage({
              message: USERS_MESSAGE.EMAIL_ALREADY_EXISTS,
              status: HTTP_STATUS.UNAUTHORIZED
            });
          }
          return true;
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: USERS_MESSAGE.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGE.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USERS_MESSAGE.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USERS_MESSAGE.PASSWORD_MUST_BE_STRONG
      }
    },
    confirm_password: {
      notEmpty: {
        errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USERS_MESSAGE.CONFIRM_PASSWORD_MUST_BE_STRONG
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(USERS_MESSAGE.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD);
          }
          return true;
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      },
      errorMessage: USERS_MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601
    }
  })
);
