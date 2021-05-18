import "source-map-support/register";

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
      const newPlanParam = productPlans.find((plan) => plan.plan === newPlan);
      console.log("plan updated!");
      const lineItemId =
        sub.line_items[0].bold_platform_subscription_line_item_id;
      const swapProductArg: SwapProductArg = {
        bold_platform_line_item_id: lineItemId,
        platform_variant_id: newPlanParam.variantId.toString(),
        platform_product_id: newPlanParam.productId.toString(),
        subscription_group_id: 13894,
      };
      console.log("swapProductArg", swapProductArg);
      await backBoldApi.subscriptions.swapProducts(subscriptionId, [
        swapProductArg,
      ]);
    }
    const subscription = await backBoldApi.subscriptions.partialUpdate(
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

const productPlans = [
  {
    plan: 4,
    productId: 6546596593751,
    variantId: 39269021220951,
    selling_plan: 409010263,
    // properties,
  },
  {
    plan: 6,
    productId: 4690768822359,
    variantId: 32497506877527,
    selling_plan: 409010263,
    // properties,
  },
  {
    plan: 10,
    productId: 6546597314647,
    variantId: 39269025153111,
    selling_plan: 409010263,
    // properties,
  },
  {
    plan: 12,
    productId: 6546597773399,
    variantId: 39269026431063,
    selling_plan: 409010263,
    // properties,
  },
];
