import "source-map-support/register";

// import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse, TypedEventHandler } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import Shopify from "shopify-api-node";
import { Note, months } from "../types/types";
import { WebhookSubscriptionCreatedEvent, BoldAPI } from "@libs/boldApi";
import { env } from "../../env";
import { updateOrder } from "@libs/shopifyApi";
const handler: TypedEventHandler<WebhookSubscriptionCreatedEvent> = async (
  event
) => {
  try {
    const shopIdentifier = event.body.shop_identifier;
    const boldApi = new BoldAPI(env.BOLD_ACCESS_TOKEN, shopIdentifier);
    const subscriptionId = event.body.id;
    const orders = await boldApi.subscriptions.listOrders(subscriptionId);
    const order = orders[0];
    // console.log("ORDER", order);
    const shopifyOrderId = parseInt(order.order.platform_id, 10);
    // console.log("shopifyOrderId", shopifyOrderId);
    const note = await getShopifyOrderNote(shopifyOrderId);
    const parsedNote: Note = JSON.parse(note);
    const ids = parsedNote.ids;
    const dateObject = setDateFromNote(parsedNote);
    console.log("dateObject", dateObject);
    const firstOrderDate = dateObject.toISOString();
    dateObject.setDate(dateObject.getDate() + 7);
    console.log("dateObject", dateObject);
    // date of next order: dateObject.getDate() + 7 final first saturday before
    // nextOrderDate
    const saturdayBefore = new Date(getdayBeforeDate(dateObject, 0));
    console.log("saturdayBefore", saturdayBefore);
    // dateObject.setDate(dateObject.getDate() + 7 - 5); // time when the order cannot be changed anymore
    const isoString = saturdayBefore.toISOString();
    const res1 = await boldApi.subscriptions.updateNextOrderDate(
      subscriptionId,
      isoString.split("T")[0] + "T08:00:00Z",
      true
    );
    console.log(res1);
    const res2 = await boldApi.subscriptions.updateNextOrderDate(
      subscriptionId,
      isoString.split("T")[0] + "T08:00:00Z",
      false
    );
    console.log(res2);
    // save day of receiving order possible thuesday, thursday, friday
    const days = [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", ];
    const deliveryDay = days[new Date(firstOrderDate).getDay()];
    const res = await boldApi.subscriptions.partialUpdate(subscriptionId, {
      note: JSON.stringify({ ids: ids, firstOrderDate, deliveryDay }),
    });
    console.log(res);
    const nextShippingDate = setDateFromNote(parsedNote);
    const zipcode = event.body.shipping_address.zip;
    await updateOrder(zipcode, nextShippingDate, shopifyOrderId, ids);
    return formatJSONResponse({
      message: "ok",
    });
  } catch (err) {
    console.error('-----------', err);
  }
};

export const main = middyfy(handler);
const getdayBeforeDate = (date: Date, dayIndex: number) => {
  var day = new Date();
  day.setFullYear(date.getFullYear());
  day.setMonth(date.getMonth());
  day.setDate(date.getDate() - date.getDay() + dayIndex + 7 % 7);
  return day.setHours(0,0);
}
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

export const setDateFromNote = (note: Note): Date => {
  console.log("NOTE", note);
  const date = note.date;
  const dateObject = new Date();
  if (typeof date.date === "string") {
    date.date = parseInt(date.date);
  }
  if (date.month === "January") {
    dateObject.setFullYear(2022)
  }
  dateObject.setDate(date.date);
  dateObject.setMonth(months[date.month]);
  return dateObject;
};
