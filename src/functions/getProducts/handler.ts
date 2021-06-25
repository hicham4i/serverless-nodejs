import "source-map-support/register";
import { productPlans } from "../plans";
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
}> = async (event) => {
  try {
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
    const backBoldApi = new BoldAPI(
      env.BOLD_ACCESS_TOKEN,
      shopIdentifier,
      false
    );
    const test = await frontBoldApi.subscriptions.get(subscriptionId);
    console.log("test", test);
    const subscription = await backBoldApi.subscriptions.get(subscriptionId);
    const productId = subscription.line_items[0].platform_variant_id;
    const plan = productPlans.find((p) => p.variantId.toString() === productId);
    console.log("subscription", subscription);
    return formatJSONResponseCors({
      note: subscription.note,
      size: plan.plan,
    });
  } catch (err) {
    console.error(err);
    return formatJSONResponseCors({
      message: "error",
    });
  }
};

export const main = middyfy(handler);
