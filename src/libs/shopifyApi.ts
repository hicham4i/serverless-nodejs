import Shopify from "shopify-api-node";
import { env } from "../env";
import zipcodes from "../zipcodes.json";
import * as AWS from "aws-sdk";

const shopify = new Shopify({
  shopName: "mykosherchef",
  apiKey: env.SHOPIFY_API_KEY,
  password: env.SHOPIFY_API_SECRET,
});
export { shopify };

export const updateOrder = async (
  zipcode: string,
  shippingDate: Date,
  orderId: number,
  productIds: number[]
) => {
  console.log(
    "UPDATE ORDER PARAMS",
    //zipcodes,
    shippingDate,
    orderId,
    productIds
  );
  if(zipcode.includes("-")) {
    zipcode = zipcode.split("-")[0];
  }
  if (!zipcodes.transporter[zipcode]) {
    console.error("zip code note recognized!");
  }
  const transporter = zipcodes.transporter[zipcode];
  const daysToDelivery = zipcodes.days[zipcode] || 2;
  shippingDate.setDate(shippingDate.getDate() - daysToDelivery);
  console.log("shipping date", shippingDate);
  const weekNumber = `Week ${getWeekNumber(shippingDate)}`;
  const shipDayTag = shippingDate
    .toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(",", "");
  const tags = [shipDayTag, weekNumber, transporter];
  const param = {
    tags: tags.join(" , "),
  };
  console.log(param);
  const test = await checkIfOrderTreated(orderId);
  if (test) {
    console.log(
      "DYNAMO : THERE IS NO NEED TO UPDATE THIS ORDER IT WAS ALREADY MODIFIED"
    );
    return;
  }
  const shopifyOrder = await shopify.order.get(orderId);
  if (shopifyOrder.line_items.length > 1) {
    console.log(
      "SHOPIFY: THERE IS NO NEED TO UPDATE THIS ORDER IT WAS ALREADY MODIFIED"
    );
    return;
  }
  const res = await shopify.order.update(orderId, param).catch((err) => {
    console.log("ERR", err);
  });
  console.log("RES:", JSON.stringify(res));
  const graphqlId = `gid://shopify/Order/${orderId}`;
  await editOrder(graphqlId, productIds);
  await putOrderEdited(orderId);
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

const getWeekNumber = (d: Date): number => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  // Return array of year and week number
  return weekNo;
};

const checkIfOrderTreated = async (orderId: number): Promise<boolean> => {
  const param: AWS.DynamoDB.DocumentClient.GetItemInput = {
    TableName: 'MyKosherChefTable',
    Key: {
      pk: `ORDER#${orderId}`,
      sk: `ORDER#${orderId}`
    }
  }
  const res = await new AWS.DynamoDB.DocumentClient().get(param).promise().catch((err) => {
    console.log("ERR", err);
    throw err;
  });
  console.log(res);
  if (res.Item) {
    return true;
  } else {
    await putOrderEdited(orderId);
    return false;
  }
}

const putOrderEdited = async (orderId: number) => {
  const param: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: 'MyKosherChefTable',
    Item: {
      pk: `ORDER#${orderId}`,
      sk: `ORDER#${orderId}`,
      edited: true
    }
  }
  await new AWS.DynamoDB.DocumentClient().put(param).promise();
  return;
}