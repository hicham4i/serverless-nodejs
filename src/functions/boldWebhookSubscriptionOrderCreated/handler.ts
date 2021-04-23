import "source-map-support/register";

import type { TypedEventHandler } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import { WebhookSubscriptionOrderCreatedEvent, BoldAPI } from "@libs/boldApi";
import { env } from "../../env";
// import schema from "./schema";
import Shopify from "shopify-api-node";
import { Note, months } from "../types/types";

const handler: TypedEventHandler<WebhookSubscriptionOrderCreatedEvent> = async (
  event
) => {
  // const handler = async (event) => {
  console.log("EVENT:", JSON.stringify(event));
  const shopIdentifier = event.body.shop_identifier;
  const boldApi = new BoldAPI(env.BOLD_ACCESS_TOKEN, shopIdentifier);
  const subscriptionId = event.body.subscription_id;
  //const res = await boldApi.getSubscription(subscriptionId);
  console.log(event.body);
  const order = event.body.order;
  const lineItems = order.line_items;
  const filteredLineItems = lineItems.filter(
    (lineItem) => !packIds.includes(lineItem.platform_variant_id)
  );
  console.log(filteredLineItems);
  if (filteredLineItems.length > 0) {
    const shopifyOrderId = parseInt(order.platform_id, 10);
    console.log("first order");
    const note = await getShopifyOrderNote(shopifyOrderId);
    const parsedNote: Note = JSON.parse(note);
    const ids = parsedNote.ids;
    const date = parsedNote.date;
    const dateObject = new Date();
    dateObject.setMonth(months[date.month]);
    dateObject.setDate(date.date - 5); // time when the order cannot be changed anymore
    const isoString = dateObject.toISOString();
    const res1 = await boldApi.updateSubscriptionNextOrderDate(
      subscriptionId,
      isoString.split(".")[0] + "Z"
    );
    console.log(res1);
    const res = await boldApi.partialUpdateSubscription(subscriptionId, {
      note: JSON.stringify({ ids: ids }),
    });
    console.log(res);
  }
  return formatJSONResponse({
    message: "ok",
  });
};

export const main = middyfy(handler);
const packIds = [
  "39269021220951",
  "32497506877527",
  "39269025153111",
  "39269026431063",
];

const getShopifyOrderNote = async (orderId: number) => {
  const shopify = new Shopify({
    shopName: "mykosherchef",
    apiKey: env.SHOPIFY_API_KEY,
    password: env.SHOPIFY_API_SECRET,
  });
  const res = await shopify.order.get(orderId);
  console.log(res);
  return res.note;
};
