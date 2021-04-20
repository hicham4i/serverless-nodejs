import "source-map-support/register";
import zipcodes from "./zipcodes.json";
import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import schema from "./schema";
import Shopify from "shopify-api-node";
const shopify = new Shopify({
  shopName: "mykosherchef",
  apiKey: "34d26fea5cad741d17f510329d887bae",
  password: "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",
});
const handler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  console.log("EVENT:", JSON.stringify(event));

  const orderId = event.body.id as number;
  const graphqlId = event.body.admin_graphql_api_id as string;
  console.log("note: ", event.body.note);
  let parsednote = JSON.parse(event.body.note as string);
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
  const cart_order = getOrderParam(ids, 1);
  const daysToDelivery = zipcodes[zipcopde];
  const dateObject = new Date();
  dateObject.setMonth(months[date.month]);
  dateObject.setDate(date.date - daysToDelivery);
  const param = {
    line_items: cart_order,
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

const getOrderParam = (ids: number[], quantity: number) => {
  const line_items = ids.map((id) => {
    return {
      variant_id: id,
      quantity,
    };
  });

  return line_items;
};

export const main = middyfy(handler);

const months = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

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

  for (const id of productIds) {
    const variantId = `gid://shopify/ProductVariant/${id}`;
    const addLineItemMutation = `mutation addVariantToOrder ($calculatedOrderId: ID!, $variantId: ID!) {
      orderEditAddVariant(id: $calculatedOrderId, variantId: $variantId, quantity: 1){
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
