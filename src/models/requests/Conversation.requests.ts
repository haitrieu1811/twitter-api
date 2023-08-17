import { ParamsDictionary } from 'express-serve-static-core';

export interface GetConversationsReqParams extends ParamsDictionary {
  receiver_id: string;
}
