import "source-map-support/register";

// import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

// import schema from "./schema";
import Shopify from "shopify-api-node";

// const handler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
const handler = async (_event) => {
  // console.log("EVENT:", JSON.stringify(event));
  const shopify = new Shopify({
    shopName: "mykosherchef",
    // apiKey: "34d26fea5cad741d17f510329d887bae",
    // password: "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",
    accessToken: "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",
    apiVersion: "2021-04",
  });
  const query = `query {
    order (id: "gid://shopify/Order/3767330373719") {
        id
        lineItems (first: 15) {
          edges {
            node {
              id,
              title,
              currentQuantity,
              contract {
                id
              }
            }
          }
        }
      }
  }`;
  const res = await shopify.graphql(query);
  // const res = await shopify.order.get(3767330373719);
  console.log(JSON.stringify(res));
  return formatJSONResponse({
    message: "ok",
  });
};

export const main = middyfy(handler);
