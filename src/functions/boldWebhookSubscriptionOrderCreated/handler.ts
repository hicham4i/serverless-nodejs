import "source-map-support/register";

import type { TypedEventHandler } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { WebhookSubscriptionOrderCreatedEvent, BoldAPI } from "@libs/boldApi";
import { env } from "../../env";
// import schema from "./schema";
import { Note } from "../types/types";
import { updateOrder } from "@libs/shopifyApi";
import { IProduct } from "shopify-api-node";
import axios from "axios";

const handler: TypedEventHandler<WebhookSubscriptionOrderCreatedEvent> = async (
  event
) => {
  try {
    // const handler = async (event) => {
    // console.log("EVENT:", JSON.stringify(event));
    const shopIdentifier = "27393687639";
    const boldApi = new BoldAPI(env.BOLD_ACCESS_TOKEN, shopIdentifier);
    console.log("BODY", event.body);
    const subscriptionId = event.body.subscription_id;
    const subscription = await boldApi.subscriptions.get(subscriptionId);
    console.log(subscription);
    if (!subscription.note) {
      console.log("NO SUBSCRIPTION NOTE!");
      console.log("THIS IS PROBABLY THE FIRST ORDER");
      return formatJSONResponse({
        message: "OK",
        event,
      });
    }
    let parsednote: Note = JSON.parse(subscription.note as string);
    console.log("THIS IS THE NOTE", parsednote);
    if (!parsednote) {
      console.error("THERE IS NOT NOTE HERE THIS IS WEIRD!");
      return formatJSONResponse({
        message: "OK",
        event,
      });
    }
    // const orderID = event.body.order.id;
    const createdAt = event.body.created_at;
    const date = new Date();
    let ids = getIDsFromNote(createdAt, parsednote);
    // find which products are available

    // change to real order date with day of the week with note day
    date.setDate(date.getDate() + 5);

    ids = await filterProducts(ids, date);


    const order = event.body.order;
    const zip = event.body.order.shipping_addresses[0].postal_code;
    const orderId = parseInt(order.platform_id, 10);
    console.log(event.body);

    // change to real order date with day of the week with note day
    const orderDate = new Date(order.placed_at);
    orderDate.setDate(orderDate.getDate() + 5);
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

const filterProducts = async (ids: number[], date: Date): Promise<number[]> => {
  const productList = await getCurrentCollection(date);
  // console.log("PRODUCTS", productList);
  const variants = productList.map((p) => p.variants[0]);
  const variantIds = variants.map((variant) => variant.id);
  console.log("VARIANT IDS are:", variantIds);
  console.log("IDS are:", ids);
  const replacedIds = ids.map((id) => {
    if (variantIds.includes(id)) {
      return id;
    } else {
      console.log("THE ID: ", id, " IS NOT INCLUDED, REPLACED WITH :", null);
      return null; // TODO: make this random?
    }
  });
  console.log("REPLACED", replacedIds);
  const filteredIds = replacedIds.filter((id) => id);
  console.log("FILTERED", filteredIds);
  let i = 0;
  const finalIds = replacedIds.map((id) => {
    if (!id) {
      const newId = filteredIds[i];
      console.log("newId", newId);
      i++;
      if (i === filteredIds.length - 1) {
        i = 0;
      }
      return newId;
    }
    return id;
  });
  console.log("FINAL IDS:", finalIds);
  return finalIds;
};

export const main = (event, context, callback) => {
  console.log("EVENT", event);
  event.body = JSON.parse(event.body);
  return handler(event, context, callback);
};

const getCurrentCollection = async (dateObject: Date): Promise<IProduct[]> => {
  const months = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };
  // dateObject.setDate(dateObject.getDate() + 7);
  const optionsMonth: Intl.DateTimeFormatOptions = {
    month: "long",
    timeZone: "America/Los_Angeles",
  };
  const optionsDate: Intl.DateTimeFormatOptions = {
    day: "numeric",
    timeZone: "America/Los_Angeles",
  };
  const month = new Intl.DateTimeFormat("en-US", optionsMonth).format(
    dateObject
  );
  const dateInt = new Intl.DateTimeFormat("en-US", optionsDate).format(
    dateObject
  );
  const date = { month, date: parseInt(dateInt) };
  const orderDate = new Date();
  orderDate.setMonth(months[date.month.toLowerCase()]);
  orderDate.setDate(date.date);
  const day = orderDate.getDay();
  const mondayOffset = day !== 0 ? day - 1 : 6;
  const sundayOffset = day !== 0 ? 7 - day : 0;
  const monday = new Date();
  monday.setMonth(months[date.month.toLowerCase()]);
  monday.setDate(orderDate.getDate() - mondayOffset);
  const mondayMonth = new Intl.DateTimeFormat("en-US", optionsMonth).format(
    monday
  );
  const sunday = new Date();
  sunday.setMonth(months[date.month.toLowerCase()]);
  sunday.setDate(orderDate.getDate() + sundayOffset);
  const sundayMonth = new Intl.DateTimeFormat("en-US", optionsMonth).format(
    sunday
  );
  console.log(sunday);
  const menuUrl = `${mondayMonth.toLowerCase()}-${monday.getDate()}-${sundayMonth}-${sunday.getDate()}`;
  console.log("MENU URL", menuUrl);
  return await axios
    .get(`https://dailycious.com/collections/${menuUrl}/products.json`)
    .then((res) => res.data.products as IProduct[]);
};

const getIDsFromNote = (date: string, note: any) => {
  console.log("date", date);
  console.log("note:", note);
  const keyDate = Object.keys(note).find((key) => {
    const fullNoteDate = key.split("-").splice(1, 3).join("-");
    const smallNoteDate = fullNoteDate.split("T")[0];
    const smallDate = date.split("T")[0];
    console.log("TEST", smallNoteDate, smallDate);
    return smallDate === smallNoteDate;
  });
  if (keyDate) {
    console.log("FOUND KEYFS");
    return note[keyDate];
  } else {
    console.log("NOT FOUDN");
    return note.ids;
  }
};
