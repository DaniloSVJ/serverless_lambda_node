import type { AWS } from 'serverless'
const serverlessConfiguration: AWS = {
  service: 'certificate-ignite',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-dynamodb', 'serverless-offline'],
  useDotenv: true,
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: "us-east-1",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
    },
    iamRoleStatements:[
      {
        Effect: "Allow",
        Action:["dynamodb:*"],
        Resource:["*"]
      },
      {
        Effect: "Allow",
        Action:["s3:*"],
        Resource:["*"]
      }
    ]
  },
 

  // import the function via paths
  functions: {
    generationCertificate: {
      handler: "src/functions/generationCertificate.handler",
      timeout: 120,
      events: [
        {
          http: {
            path: "generationCertificate",
            method: "post",
            cors: true
          }
        }
      ]
    },
    verifyCertificate: {
      handler: "src/functions/verifyCertificate.handler",
      timeout: 120,
      events: [
        {
          http: {
            path: "verifyCertificate/{id}",
            method: "get",
            cors: true
          }
        }
      ]
    }

  },
  package: { individually: false,include:["./src/templates/**"] },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      //exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
      external:['puppeteer-core']
    },
    dynamodb:{
      stages:["dev","local"],
      start: {
        port:8000,
        inMemory: true,
        docker:false,
        migrate:true
      }
    }
  },
  resources: {
    Resources: {
      dbCertificationUser: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "users-certificate",
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH',
            },
          ],
        }
      }
    }
  },
};

module.exports = serverlessConfiguration;
