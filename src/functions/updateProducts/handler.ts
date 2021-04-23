import "source-map-support/register";

// import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import {
  formatJSONResponseError,
  formatJSONResponseCors,
  TypedEventHandler,
} from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import { BoldAPI } from "@libs/boldApi";
import { env } from "../../env";

// import schema from "./schema";

// TODO check this weird bug where body is note parsed;
const handler: TypedEventHandler<{
  shopIdentifier: string;
  shopUrl: string;
  subscriptionId: number;
  token: string;
  ids: number[];
}> = async (event) => {
  console.log("EVENT:", JSON.stringify(event));
  const body = event.body;
  const subscriptionId = body.subscriptionId;
  const token = body.token;
  console.log("ORDER ID", subscriptionId);
  if (!subscriptionId || !token) {
    return formatJSONResponseError({
      message: "no id or token",
    });
  }
  const shopIdentifier = body.shopIdentifier || "27393687639";
  const shopUrl = body.shopUrl || "dailycious.com";
  const frontBoldApi = new BoldAPI(token, shopUrl, true);
  const backBoldApi = new BoldAPI(env.BOLD_ACCESS_TOKEN, shopIdentifier, false);
  const test = await frontBoldApi.getSubscription(subscriptionId);
  console.log("test", test);
  const ids = body.ids;
  console.log("ids", ids);
  if (ids && ids.length > 0) {
    const subscription = await backBoldApi.partialUpdateSubscription(
      subscriptionId,
      {
        note: JSON.stringify({ ids: ids }),
      }
    );
    console.log("subscription", subscription);
    return formatJSONResponseCors({
      note: subscription.note,
    });
  }
  return formatJSONResponseError({
    message: "no ids sent",
  });
};

export const main = middyfy(handler);
