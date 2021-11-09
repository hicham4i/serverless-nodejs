import "source-map-support/register";
import { productPlans } from "../plans";
// import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import {
  formatJSONResponseError,
  formatJSONResponseCors,
  TypedEventHandler,
} from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import { BoldAPI, SwapProductArg } from "@libs/boldApi";
import { env } from "../../env";

// import schema from "./schema";

// TODO check this weird bug where body is note parsed;
const handler: TypedEventHandler<{
  shopIdentifier: string;
  shopUrl: string;
  subscriptionId: number;
  token: string;
  ids: number[];
  orderId?: number;
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
  const sub = await frontBoldApi.subscriptions.get(subscriptionId);
  console.log("sub", sub);
  const ids = body.ids;
  console.log("ids", ids);
  if (ids && ids.length > 0) {
    const oldPlanId = sub.line_items[0].platform_variant_id;
    console.log("oldPlanId", oldPlanId);
    const oldPlan = productPlans.find(
      (plan) => plan.variantId.toString() === oldPlanId
    );
    console.log("oldPlan", oldPlan);
    const newPlan = ids.length;
    if (newPlan !== oldPlan.plan) {
      const newPlanParam = productPlans.find((plan) => plan.plan === newPlan && plan.student === oldPlan.student);
      console.log("plan updated!");
      const lineItemId =
        sub.line_items[0].bold_platform_subscription_line_item_id;
      const swapProductArg: SwapProductArg = {
        bold_platform_line_item_id: lineItemId,
        platform_variant_id: newPlanParam.variantId.toString(),
        platform_product_id: newPlanParam.productId.toString(),
        subscription_group_id: oldPlan.subscription_group_id,
      };
      console.log("swapProductArg", swapProductArg);
      await backBoldApi.subscriptions.swapProducts(subscriptionId, [
        swapProductArg,
      ]);
    }
    const fullSubscription = await backBoldApi.subscriptions.get(
      subscriptionId
    );
    console.log("fullSubscription", fullSubscription);
    let noteObject = {} as any;
    try {
      noteObject = JSON.parse(fullSubscription.note);
    } catch (err) {
      console.error(err);
    }
    noteObject.ids = ids;
    noteObject.date = new Date().toISOString();
    const orderId = body.orderId;
    if (orderId) {
      noteObject[orderId] = ids;
    }
    const subscription = await backBoldApi.subscriptions.partialUpdate(
      subscriptionId,
      {
        note: JSON.stringify(noteObject),
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
