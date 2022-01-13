import "source-map-support/register";
import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import schema from "./schema";
import { shopify } from "@libs/shopifyApi";
// import { Note, months } from "../types/types";
// import { updateOrder } from "@libs/shopifyApi";
const handler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  console.log("test 2")
  const commitEditMutation = `query ($first: Int!) {
    sellingPlanGroups (first: $first)  {
      edges {
        node {
          appId
          createdAt
        }
      }
    }
  }`;
const commitVariables = {
  first : 10
};
console.log("request: ", commitEditMutation);
const res2 = await shopify.graphql(commitEditMutation, commitVariables).catch(err => {
  console.log(err)
})
console.log("res: ", res2);
};

export const main = middyfy(handler);
