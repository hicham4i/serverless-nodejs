import "source-map-support/register";

import type { TypedEventHandler } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import { WebhookSubscriptionOrderCreatedEvent, BoldAPI } from "@libs/boldApi";
import { env } from "../../env";
// import schema from "./schema";
import { Note } from "../types/types";
import { updateOrder } from "@libs/shopifyApi";

const handler: TypedEventHandler<WebhookSubscriptionOrderCreatedEvent> = async (
  event
) => {
  try {
    // const handler = async (event) => {
    console.log("EVENT:", JSON.stringify(event));
    const shopIdentifier = event.body.shop_identifier;
    const boldApi = new BoldAPI(env.BOLD_ACCESS_TOKEN, shopIdentifier);
    const subscriptionId = event.body.subscription_id;
    const subscription = await boldApi.subscriptions.get(subscriptionId);
    console.log(subscription);
    if (!subscription.note) {
      return formatJSONResponse({
        message: "OK",
        event,
      });
    }
    let parsednote: Note = JSON.parse(subscription.note as string);
    if (!parsednote) {
      return formatJSONResponse({
        message: "OK",
        event,
      });
    }
    const ids = parsednote.ids;
    const order = event.body.order;
    const zip = event.body.order.shipping_addresses[0].postal_code;
    const orderId = parseInt(order.platform_id, 10);
    console.log(event.body);
    const orderDate = new Date(order.placed_at);
    orderDate.setDate(orderDate.getDate() + 5);
    // const order = event.body.order;
    // const lineItems = order.line_items;
    await updateOrder(zip, orderDate, orderId, ids);
    return formatJSONResponse({
      message: "ok",
    });
  } catch (err) {
    console.error(err);
    return formatJSONResponse({
      message: "ok",
    });
  }
};

export const main = middyfy(handler);
