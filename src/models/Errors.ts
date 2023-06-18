import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGE } from '~/constants/messages';

type ErrorsType = Record<
  string,
  {
    msg: string;
    [key: string]: any;
  }
>;

export class ErrorWithMessage {
  message: string;
  status: number;

  constructor({ message, status }: { message: string; status: number }) {
    this.message = message;
    this.status = status;
  }
}

export class EntityError extends ErrorWithMessage {
  errors: ErrorsType;

  constructor({ message = USERS_MESSAGE.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY });
    this.errors = errors;
  }
}
