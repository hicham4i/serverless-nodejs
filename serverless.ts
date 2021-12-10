import type { AWS } from "@serverless/typescript";

import { functions } from "./src/functions";

const serverlessConfiguration: AWS = {
  // org: "mathisob",
  app: "dailycious",
  service: "mykosherchef",
  frameworkVersion: "2",
  custom: {
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: true,
    },
  },
  plugins: ["serverless-webpack"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Resource: [
          `arn:aws:dynamodb:us-east-1:735902564930:table/MyKosherChefTable/*`,
          `arn:aws:dynamodb:us-east-1:735902564930:table/MyKosherChefTable`,
        ],
        Action: [
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:BatchGetItem",
          "dynamodb:PutItem",
        ],
      },
    ],
    lambdaHashingVersion: "20201221",
  },
  functions,
  resources: {
    Resources: {
      MykosherchefDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "MyKosherChefTable",
          KeySchema: [
            {
              AttributeName: "sk",
              KeyType: "HASH",
            },
            {
              AttributeName: "pk",
              KeyType: "RANGE",
            },
          ],
          AttributeDefinitions: [
            {
              AttributeName: "sk",
              AttributeType: "S",
            },
            {
              AttributeName: "pk",
              AttributeType: "S",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
