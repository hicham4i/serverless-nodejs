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
  const shopIdentifier = "27393687639";
  const bold = new BoldAPI(env.BOLD_ACCESS_TOKEN, shopIdentifier);
  const res = await bold.subscriptions.getAll(shopIdentifier, '?limit=200');
  const activeS = res.filter(s => s.subscription_status === 'active' && s.next_order_datetime.includes('2022-02-0') && !s.next_order_datetime.includes('T08:00:00Z'))
  .map(x => ({id: x.id,name: x.billing_address.first_name +' '+ x.billing_address.last_name, date: x.next_order_datetime}));
  console.log('🚀 ~ file: handler.ts ~ line 18 ~ activeS', activeS);
  // const updated = await bold.subscriptions.partialUpdate(724666, {
  //   next_order_datetime: '2022-02-06T08:00:00Z'
  // });
  
  // const updated = await bold.subscriptions.updateNextOrderDate(
  //   724666,
  //   '2022-02-06T08:00:00Z',
  //   false
  // );
  // console.log('🚀 ~ file: handler.ts ~ line 23 ~ updated', updated);

// 724666

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

export const main = middyfy(handler);
