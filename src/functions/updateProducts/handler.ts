import "source-map-support/register";

// import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import {
  formatJSONResponseError,
  formatJSONResponseCors,
} from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

// import schema from "./schema";
import Shopify from "shopify-api-node";

// const handler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
const handler = async (event) => {
  console.log("EVENT:", JSON.stringify(event));

  const shopify = new Shopify({
    shopName: "mykosherchef",
    apiKey: "34d26fea5cad741d17f510329d887bae",
    password: "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",
  });
  const body = event.body;
  console.log("BODY", body);
  const parsedBody = JSON.parse(body);
  console.log("TYPE OF BODY", typeof body);
  console.log("TYPE OF PARSEDBODY", typeof parsedBody);
  console.log("PARSEDBODY", parsedBody);
  const orderId = parsedBody.orderId;
  const note = parsedBody.note;
  console.log("ORDER ID", orderId);
  if (!orderId) {
    return formatJSONResponseError({
      message: "OK",
      event,
    });
  }
  const order = await shopify.order.update(orderId, { note });
  console.log(order);
  const updatedNote = order.note;
  return formatJSONResponseCors({
    updatedNote,
  });
};

export const main = middyfy(handler);
