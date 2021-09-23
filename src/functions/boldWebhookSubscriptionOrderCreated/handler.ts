import "source-map-support/register";

import type { TypedEventHandler } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { WebhookSubscriptionOrderCreatedEvent, BoldAPI } from "@libs/boldApi";
import { env } from "../../env";
// import schema from "./schema";
import { Note } from "../types/types";
import { updateOrder } from "@libs/shopifyApi";
import Shopify from "shopify-api-node";

const handler: TypedEventHandler<WebhookSubscriptionOrderCreatedEvent> = async (
  event
) => {
  try {
    // const handler = async (event) => {
    console.log("EVENT:", JSON.stringify(event));
    const shopIdentifier = "27393687639";
    const boldApi = new BoldAPI(env.BOLD_ACCESS_TOKEN, shopIdentifier);
    console.log("BODY", event.body);
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
const getShopifyProducts = async (params?: any) => {
  const shopify = new Shopify({
    shopName: "mykosherchef",
    apiKey: env.SHOPIFY_API_KEY,
    password: env.SHOPIFY_API_SECRET,
  });
  const res = await shopify.product.list(params);
  console.log('getShopifyProducts ==>', res);
  return res;
};

const isContained = async (ids: string | string[]) => {
  const productList = await getShopifyProducts();
  if (typeof ids === "string") {
    const ordredProducts = productList.find(p => p.id === ids);
    return ordredProducts ? true : false;
  }
  const ordredProducts = productList.filter(p => ids.includes(p.id));
  return ordredProducts.length === ids.length;
}

export const main = (event, context, callback) => {
  console.log("EVENT", event);
  event.body = JSON.parse(event.body);
  return handler(event, context, callback);
};
