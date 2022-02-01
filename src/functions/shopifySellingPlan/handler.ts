import "source-map-support/register";
import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import schema from "./schema";
import { shopify } from "@libs/shopifyApi";
import { BoldAPI } from "@libs/boldApi";
import { env } from "../../env";

// import { Note, months } from "../types/types";
// import { updateOrder } from "@libs/shopifyApi";
const handler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  const body = event.body;
  const token = `${body.token}`;  
  const shopIdentifier = '27393687639';
  const shopUrl = 'dailycious.com';
  const frontBoldApi = new BoldAPI(token, shopUrl, true);
  const backBoldApi = new BoldAPI(
    env.BOLD_ACCESS_TOKEN,
    shopIdentifier,
    false
  );
  const res = await backBoldApi.subscriptions.getAll(shopIdentifier, '?limit=200');
  const activeS = res.filter(s => s.subscription_status === 'active' && s.next_order_datetime.includes('2022-02-0') && !s.next_order_datetime.includes('T08:00:00Z'))
  .map(x => ({id: x.id,name: x.billing_address.first_name +' '+ x.billing_address.last_name, date: x.next_order_datetime}));
  console.log('🚀 ~ file: handler.ts ~ line 18 ~ activeS', activeS);

  // THIS IS FOR TEST Currently the data is 
  // {
  //   id: 711017,
  //   name: 'Cynthia Rodrigues',
  //   date: '2022-02-05T23:00:00Z'
  // }

  // This will change to 2022-02-06T08:00:00Z
  const updated = await frontBoldApi.subscriptions.updateNextOrderDate(
    711017,
    getNextSunday(),
    false
  );
  console.log('🚀 ~ file: handler.ts ~ line 23 ~ updated', updated);


//   console.log("test 2")
//   const commitEditMutation = `query {
//     customers (first: 5) {
//       edges {
//         node {
//           id
//           createdAt
//           paymentMethods (first: 5) {
//             edges {
//               node {
//                 id
//                 instrument
//               }
//             }
//           }
//         }
//       }
//     }
//   }`;
// const commitVariables = {
//   first : 10
// };
// console.log("request: ", commitEditMutation);
// const cutomers = await shopify.tenderTransaction.list();
// console.log('🚀 ~ file: handler.ts ~ line 28 ~ cutomers', cutomers);
// const res2 = await shopify.graphql(commitEditMutation, commitVariables).catch(err => {
//   console.log(err)
// })
// console.log("res: ", JSON.stringify(res2));
};
const getNextSunday = () => {
  let nextSunday = new Date();
  nextSunday.setDate(nextSunday.getDate() + 7 - nextSunday.getDay());
  const parts =  nextSunday.toISOString().split('T');
  parts[1] = '08:00:00Z'
  return parts.join('T');
};
export const main = middyfy(handler);
