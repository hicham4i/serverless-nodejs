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
  const ids = event.body.line_items[0].properties.find(property => property.name === '_ids')?.value;
  if (!ids) {
    return formatJSONResponse({
      message: 'No Ids',
      event,
    });
  }
  console.log("RESULT:",ids);
   const shopify = new Shopify({
     shopName: 'mykosherchef-test',
     apiKey: '3336bb971ab6ff051a0cea9a11c953dd',
     password: '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'
   });

    const param = {
      line_items: [
        {
          variant_id: 6237580755126,
          quantity: 1
        }
      ]
  };
  console.log (param);
    const res = await shopify.order.create(param);
   console.log("RES:", JSON.stringify(res));
  
  
  //TODO - Check if 6 meals packs or more
  return formatJSONResponse({
    message: 'OK',
    event,
  });
};

export const main = middyfy(hello);
