import "source-map-support/register";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import schema from "./schema";
import * as Shopify from "shopify-api-node";


const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  console.log("EVENT:", JSON.stringify(event));

  
  const shopify = new Shopify({
    shopName: 'mykosherchef',
    apiKey: '34d26fea5cad741d17f510329d887bae',
    password: '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'
  });
  

  const line_items = [];
  event.body.line_items.forEach(line_item => {
    const ids = line_item.properties.find(property => property.name === '_ids')?.value;
    const quantity = line_item.quantity;
    if (!ids) {
      return;
    }
    console.log("RESULT:", ids);
  
    if (typeof ids === 'string') {
      return;
    }
    const cart_order = getOrderParam(ids,quantity);
    line_items.push(...cart_order);
  })
  let parsednote = JSON.parse(event.body.note as string);

  const param = {
    line_items,
    note:event.body.note,
    tags:parsednote.date + ' ' + parsednote.month
  }
  console.log(param);
  const res = await shopify.order.create(param);
  console.log("RES:", JSON.stringify(res));


 
  return formatJSONResponse({
    message: 'OK',
    event,
  });
};


const getOrderParam = (ids: number[], quantity:number) => {
  const line_items =
    ids.map(id => {
      return {
        variant_id: id,
        quantity 
      }
    })

  return line_items;
};



export const main = middyfy(hello);
