import "source-map-support/register";
import zipcodes from "./zipcodes.json";
import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import schema from "./schema";
import Shopify from "shopify-api-node";
import { env } from "../../env";
import { Note, months } from "../types/types";
const shopify = new Shopify({
  shopName: "mykosherchef",
  apiKey: env.SHOPIFY_API_KEY,
  password: env.SHOPIFY_API_SECRET,
});
const handler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  console.log("EVENT:", JSON.stringify(event));

  const orderId = event.body.id as number;
  const graphqlId = event.body.admin_graphql_api_id as string;
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
  const zipcopde = parsednote.zipcode;
  const daysToDelivery = zipcodes[zipcopde];
  const dateObject = new Date();
  dateObject.setMonth(months[date.month]);
  dateObject.setDate(date.date - daysToDelivery);
  const param = {
    tags: dateObject
      .toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(",", ""),
  };
  console.log(param);
  const res = await shopify.order.update(orderId, param).catch((err) => {
    console.log("ERR", err);
  });
  console.log("RES:", JSON.stringify(res));
  await editOrder(graphqlId, ids);

  return formatJSONResponse({
    message: "OK",
    event,
  });
};

export const main = middyfy(handler);

const editOrder = async (orderId: string, productIds: number[]) => {
  const startEditMutation = `mutation beginEdit ($orderId: ID!) {
    orderEditBegin(id: $orderId){
       calculatedOrder{
         id
       }
     }
   }`;
  const startVariables = {
    orderId,
  };
  const res = await shopify.graphql(startEditMutation, startVariables);
  console.log("start edit", res);
  const calculatedOrderId = res.orderEditBegin.calculatedOrder.id;
  const quantities: { id: number; quantity: number }[] = [];
  productIds.forEach((id) => {
    const index = quantities.findIndex((q) => q.id === id);
    if (index !== -1) {
      quantities[index].quantity += 1;
    } else {
      quantities.push({ id, quantity: 1 });
    }
  });
  for (const quantity of quantities) {
    const variantId = `gid://shopify/ProductVariant/${quantity.id}`;
    const addLineItemMutation = `mutation addVariantToOrder ($calculatedOrderId: ID!, $variantId: ID!, $quantity: Int!) {
      orderEditAddVariant(id: $calculatedOrderId, variantId: $variantId, quantity: $quantity){
        calculatedOrder {
          id
          addedLineItems(first:12) {
            edges {
              node {
                id
                quantity
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }`;
    const addLineItemVariables = {
      calculatedOrderId,
      variantId,
      quantity: quantity.quantity,
    };
    const res2 = await shopify.graphql(
      addLineItemMutation,
      addLineItemVariables
    );
    console.log("start edit", res2);
  }

  const commitEditMutation = `mutation commitEdit ($calculatedOrderId: ID!) {
    orderEditCommit(id: $calculatedOrderId, notifyCustomer: false, staffNote: "Order edited by webhook!") {
      order {
        id
      }
      userErrors {
        field
        message
      }
    }
  }`;
  const commitVariables = {
    calculatedOrderId,
  };
  const res2 = await shopify.graphql(commitEditMutation, commitVariables);
  console.log("start edit", res2);
};
