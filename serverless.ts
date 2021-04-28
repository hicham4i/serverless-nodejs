import type { AWS } from "@serverless/typescript";

import {
  shopifyWebhook,
  getProducts,
  boldWebhookSubscriptionCreated,
  boldWebhookSubscriptionOrderCreated,
  showAllProducts,
  tagBoldSubscription,
  updateProducts,
} from "./src/functions";

const serverlessConfiguration: AWS = {
  org: "mathisob",
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
    runtime: "nodejs12.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
    },
    lambdaHashingVersion: "20201221",
  },
  functions: {
    shopifyWebhook,
    getProducts,
    updateProducts,
    boldWebhookSubscriptionCreated,
    boldWebhookSubscriptionOrderCreated,
    showAllProducts,
    tagBoldSubscription,
  },
};

module.exports = serverlessConfiguration;
