import "source-map-support/register";
import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import schema from "./schema";
import { Note, months } from "../types/types";
import { updateOrder } from "@libs/shopifyApi";
const handler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  console.log("EVENT:", JSON.stringify(event));
  const orderId = event.body.id as number;
  console.log("note: ", event.body.note);
  let parsednote: Note = JSON.parse(event.body.note as string);
  if (!parsednote || !parsednote.date) {
    return formatJSONResponse({
      message: "OK",
      event,
    });
  }
  const ids = parsednote.ids;
  // const quantity = line_item.quantity;
  if (!ids) {
    return;
  }
  console.log("RESULT:", ids);

  if (typeof ids === "string") {
    return;
  }
  const date = parsednote.date;

  const dateObject = new Date();
  dateObject.setMonth(months[date.month]);
  dateObject.setDate(date.date);
  const zipcode = event.body.shipping_address.zip;
  await updateOrder(zipcode, dateObject, orderId, ids);
  return formatJSONResponse({
    message: "OK",
    event,
  });
};

export const main = middyfy(handler);
