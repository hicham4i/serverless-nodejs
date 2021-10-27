import "source-map-support/register";
// import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponseCors, TypedEventHandler } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import { shopify } from "@libs/shopifyApi";

const handler: TypedEventHandler<{}> = async (event) => {
  try {
    // how to test your code: npx sls invoke local -f generateCSV --path src/functions/generateCSV/mock.json --stage prod
    console.log("EVENT:", JSON.stringify(event)); // event should be empty
    // first get the dates for next week in the form of e.g Oct 28 2021
    // should get a list looking like ["Oct 28 2021", "Oct 29 2021", "Oct 30 2021"] etc... with 7 days

    // fetch the data from shopify to get the full list of orders that were created in the last 15 days (not sure we need that much maybe 5 or 10 is enough )
    const orders = await shopify.order.list({});
    console.log("ORDERS", orders);
    // create an object an array like: taggedOrders = [{date: "Oct 29 2021", orders: []}, {date: "Oct 30 2021", orders: []}] etc

    // for each order in the order list, add to the tagged orders array if it has a tag with the date (order.tags.includes(date) or something like that)

    // generate a CSV with the tagged orders array.
  } catch (err) {
    console.error(err);
    return formatJSONResponseCors({
      message: "error",
    });
  }
};

export const main = middyfy(handler);
