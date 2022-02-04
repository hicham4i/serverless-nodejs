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
  const shopIdentifier = '27393687639';
  const backBoldApi = new BoldAPI(
    env.BOLD_ACCESS_TOKEN,
    shopIdentifier,
    false
  );
  const daybefore = new Date(getNextSunday());
  const dayAfter = new Date(getNextSunday());
  daybefore.setDate(daybefore.getDate() - 1);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const daybeforeTime = daybefore.getTime();
  const dayAfterTime = dayAfter.getTime();
  const res = await backBoldApi.subscriptions.getAll(shopIdentifier, '?limit=200');
  const filtered =  res.reduce((prev, curr) => {
    const date = new Date(curr.next_order_datetime).getTime();
    if (
      curr.subscription_status === 'active' &&
      daybeforeTime <= date && dayAfterTime >= date &&
      !curr.next_order_datetime.includes('T08:00:00Z')
    ) {
      prev.push({id: curr.id,name: curr.billing_address.first_name +' '+ curr.billing_address.last_name, date: curr.next_order_datetime})
    }
    return prev;
  }, []);
  console.log('========> ~ file: handler.ts ~ line 37 ~ filtered', filtered);

  filtered.forEach(async (sub) => {
    try {
      const updated = await backBoldApi.subscriptions.updateNextOrderDate(
        sub.id,
        getNextSunday(),
        false
      );
      console.log('🚀 ~  ', sub.name, ' ~ updated');
    } catch (error) {
      console.log('🚀 ~  ', sub.name, ' ~ error');
    }
  });





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
