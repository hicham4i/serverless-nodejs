import "source-map-support/register";
// import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponseCors, TypedEventHandler } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import { shopify } from "@libs/shopifyApi";
import Shopify from "shopify-api-node";
var stringify = require('csv-stringify');

const handler: TypedEventHandler<{}> = async (event) => {
  try {
    // how to test your code: npx sls invoke local -f generateCSV --path src/functions/generateCSV/mock.json --stage prod
    // event should be empty
    console.log("======= >EVENT:", JSON.stringify(event)); 
    // first get the dates for next week in the form of e.g Oct 28 2021
    // should get a list looking like ["Oct 28 2021", "Oct 29 2021", "Oct 30 2021"] etc... with 7 days

    // fetch the data from shopify to get the full list of orders that were created in the last 15 days (not sure we need that much maybe 5 or 10 is enough )
    const orders = await shopify.order.list();
    const upcomingDates = getUpcomingDates();
    const upcomingOrders = orders.filter(order => upcomingDates.includes(getDateFromTag(order.tags)));

    let allProducts = [];

    upcomingOrders.forEach((order) => {
      const orderProducts = getProducts(order, getDateFromTag(order.tags));
      allProducts = allProducts.concat(orderProducts);
    });
    const CsvProducts = allProducts.reduce((previous, current) => {
      let entry = previous.find(p => p.id === current.id);
      entry && entry[current.date] ? entry[current.date] += current.quantity : 
      entry ? entry[current.date] = current.quantity : 
      previous.push(getEntryFromProduct(current.title, current.id, current.date, current.quantity, upcomingDates))
      return previous
    }, []);

    stringify(CsvProducts, { header: true }, (err, output) => {
      if (err) throw err;
      console.log("🚀 ~ file: handler.ts ~ line 38 ~ stringify ~ output", output)

      // fs.writeFile(__dirname+'/weekProducts.csv', output);
    });

    // create an object an array like: taggedOrders = [{date: "Oct 29 2021", orders: []}, {date: "Oct 30 2021", orders: []}] etc

    // for each order in the order list, add to the tagged orders array if it has a tag with the date (order.tags.includes(date) or something like that)
    // get products inside order
    // generate a CSV with the tagged orders array.
  } catch (err) {
    console.error(err);
    return formatJSONResponseCors({
      message: "error",
    });
  }
};
const getEntryFromProduct = (title:  string, id: string, date: string, quantity: number, upcomingDates) => {
  const entry = {
    id,
    title
  };
  upcomingDates.forEach(d => {
    entry[d] = 0;
  });
  entry[date] = quantity;
  return entry;
};
const formatDate = (date: Date) => {
  const day = date.toLocaleString('default', { day: '2-digit' });
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.toLocaleString('default', { year: 'numeric' });
  return `${month} ${day} ${year}`;
};
const getUpcomingDates = () => {
  let upcongDates: string[] = [];
  const date = new Date();
  for (let i = 0; i <= 7; i++) {
    date.setDate(date.getDate() + 1);
    upcongDates = [...upcongDates, formatDate(date)];
  }
  return upcongDates;
};
const getDateFromTag  = (tag: string) => {
  return tag ? tag.split(',')[1].trim() : '';
};
const getProducts  = (order: Shopify.IOrder, date: string) => {
  const productCount = [];
  order.line_items.forEach((lineItem) => {
    const index = productCount.findIndex(
      (prod) => prod.id === lineItem.product_id
    );
    if (index !== -1) {
      productCount[index].quantity += lineItem.quantity;
    } else {
      productCount.push({
        id: lineItem.product_id,
        quantity: lineItem.quantity,
        title: lineItem.title,
        date
      });
    }
  });
  return productCount;
};
export const main = middyfy(handler);
