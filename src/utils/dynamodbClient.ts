import { DynamoDB } from 'aws-sdk';

const options = {
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey:  process.env.AWS_SECRET_ACCESS_KEY,
};

const isOffline = () => {
  return process.env.IS_OFFLINE;
};

export const document = isOffline()
  ? new DynamoDB.DocumentClient(options)
  : new DynamoDB.DocumentClient();