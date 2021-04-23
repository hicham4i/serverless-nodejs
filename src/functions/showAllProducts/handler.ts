import "source-map-support/register";

// import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import {
  formatHTMLResponse,
  // formatJSONResponseError,
  // formatJSONResponseCors,
} from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

// import schema from "./schema";
import Shopify, { IOrderLineItem } from "shopify-api-node";

// const handler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async(event) => {
const handler = async (event) => {
  console.log("EVENT:", JSON.stringify(event));
  // const tag = event.queryStringParameters["tag"];
  // if (!tag) {
  //   return formatJSONResponseError({ message: "no tag found" });
  // }
  const idArray = event.multiValueQueryStringParameters["ids[]"] as string[];
  const ids = idArray.join(",");
  const shopify = new Shopify({
    shopName: "mykosherchef",
    apiKey: "34d26fea5cad741d17f510329d887bae",
    password: "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",
  });
  const res = await shopify.order.list({ ids, status: "any" });
  console.log(res);
  const allLineItems: IOrderLineItem[] = [];
  const lineItems = res.map((order) => order.line_items);
  lineItems.forEach((lineItem) => allLineItems.push(...lineItem));
  const productCount: { id: number; quantity: number; title: string }[] = [];
  allLineItems.forEach((lineItem) => {
    const index = productCount.findIndex(
      (prod) => prod.id === lineItem.product_id
    );
    if (index !== -1) {
      productCount[index].quantity += 1;
    } else {
      productCount.push({
        id: lineItem.product_id,
        quantity: lineItem.quantity,
        title: lineItem.title,
      });
    }
  });
  return formatHTMLResponse(
    `
   <!DOCTYPE html>
   <html lang="en">
   
   <head>
     <meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
   </head>
   
   <body>
     
   <div class="container">
    ${productCount
      .map((prod) => `<p> ${prod.title} (${prod.id}): ${prod.quantity} </p>`)
      .join(" ")}
   </div>
   
   <script>
   </script>
   
   </body>
   </html>
   `
  );
};

export const main = middyfy(handler);
