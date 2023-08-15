/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();
// Create SES service object.
const sesClient = new SESClient({
  region: process.env.AWS_REGION as string,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
});

const createSendEmailCommand = ({
  fromAddress,
  toAddresses,
  ccAddresses = [],
  body,
  subject,
  replyToAddresses = []
}: {
  fromAddress: string;
  toAddresses: string | string[];
  ccAddresses?: string | string[];
  body: string;
  subject: string;
  replyToAddresses?: string | string[];
}) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
      ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses]
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: fromAddress,
    ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
  });
};

const sendEmail = (toAddress: string, subject: string, body: string) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: process.env.SES_FROM_ADDRESS as string,
    toAddresses: toAddress,
    body,
    subject
  });
  return sesClient.send(sendEmailCommand);
};

const verifyEmailTemplate = fs.readFileSync(path.resolve('src/templates/email-verify.html'), 'utf-8');

export const sendVerifyEmail = (toAddress: string, email_verify_token: string) => {
  return sendEmail(
    toAddress,
    'Verify email',
    verifyEmailTemplate
      .replace('{{title}}', 'Verify your email')
      .replace(
        '{{content}}',
        '<p>Click the button below to verify your email</p><p>If you are <span style="color: red">not the sender of the request</span>, please skip</p>'
      )
      .replace('{{titleLink}}', 'Verify now')
      .replace('{{link}}', `${process.env.CLIENT_URL}/verify-email?token=${email_verify_token}`)
  );
};

export const sendForgotPasswordEmail = (toAddress: string, forgot_password_token: string) => {
  return sendEmail(
    toAddress,
    'Respond to request to reset password',
    verifyEmailTemplate
      .replace('{{title}}', 'Respond to request to reset password')
      .replace(
        '{{content}}',
        '<p>Click the button below to reset your password</p><p>If you are <span style="color: red">not the sender of the request</span>, please skip</p>'
      )
      .replace('{{titleLink}}', 'Reset password')
      .replace('{{link}}', `${process.env.CLIENT_URL}/verify-forgot-password?token=${forgot_password_token}`)
  );
};
