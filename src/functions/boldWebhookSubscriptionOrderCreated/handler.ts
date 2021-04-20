import "source-map-support/register";

// import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

// import schema from "./schema";
// import * as Shopify from "shopify-api-node";

// const handler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
const handler = async (event) => {
  console.log("EVENT:", JSON.stringify(event));
  return formatJSONResponse({
    message: "ok",
  });
};

export const main = middyfy(handler);
