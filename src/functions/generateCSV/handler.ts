import "source-map-support/register";
// import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponseCors, TypedEventHandler } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import { shopify } from "@libs/shopifyApi";
import Shopify from "shopify-api-node";
var stringify = require("csv-stringify");

const handler: TypedEventHandler<{}> = async (event) => {
  try {
    // how to test your code: npx sls invoke local -f generateCSV --path src/functions/generateCSV/mock.json --stage prod
    // event should be empty
    console.log("======= >EVENT:", JSON.stringify(event));
    // first get the dates for next week in the form of e.g Oct 28 2021
    // should get a list looking like ["Oct 28 2021", "Oct 29 2021", "Oct 30 2021"] etc... with 7 days

    // fetch the data from shopify to get the full list of orders that were created in the last 15 days (not sure we need that much maybe 5 or 10 is enough )
    const orders = await shopify.order.list({ limit: 250 });
    const upcomingDates = getUpcomingDates();
    console.log("======= >UPCOMING DATES:", upcomingDates);
    const upcomingOrders = orders.filter((order) => {
      console.log(
        "TAGS",
        order.tags,
        "INLCUDED",
        checkIfDateIncluded(upcomingDates, order.tags)
      );
      return checkIfDateIncluded(upcomingDates, order.tags);
    });

    let allProducts = [];

    upcomingOrders.forEach((order) => {
      const date = checkIfDateIncluded(upcomingDates, order.tags);
      if (date) {
        const orderProducts = getProducts(order, date);
        allProducts = allProducts.concat(orderProducts);
      }
    });
    const CsvProducts = allProducts.reduce(
      (previous, current) => {
        let entry = previous.find((p) => +p.id === +current.id);
        entry && entry[current.date]
          ? (entry[current.date] += current.quantity)
          : entry
          ? (entry[current.date] = current.quantity)
          : previous.push(
              getEntryFromProduct(
                current.title,
                current.id,
                current.date,
                current.quantity,
                upcomingDates
              )
            );
        return previous;
      },
      [
        getEntryFromProduct(
          "Four Meals Pack",
          "6546596593751",
          null,
          null,
          upcomingDates
        ),
        getEntryFromProduct(
          "Six Meals Pack",
          "4690768822359",
          null,
          null,
          upcomingDates
        ),
        getEntryFromProduct(
          "Ten Meals Pack",
          "6546597314647",
          null,
          null,
          upcomingDates
        ),
        getEntryFromProduct(
          "Twelve Meals Pack",
          "6546597773399",
          null,
          null,
          upcomingDates
        ),
        getEntryFromProduct(
          "Four Meals Pack Students",
          "6628826644567",
          null,
          null,
          upcomingDates
        ),
        getEntryFromProduct(
          "Six Meals Pack Students",
          "6636408209495",
          null,
          null,
          upcomingDates
        ),
        getEntryFromProduct(
          "Ten Meals Pack Students",
          "6636407685207",
          null,
          null,
          upcomingDates
        ),
        getEntryFromProduct(
          "Twelve Meals Pack Students",
          "6636405817431",
          null,
          null,
          upcomingDates
        ),
      ]
    );
    // console.log("🚀 ~ file: handler.ts ~ line 35 ~ CsvProducts ~ CsvProducts", CsvProducts)

    return new Promise((resolve, reject) => {
      stringify(CsvProducts, { header: true }, (err, output) => {
        if (err) reject(err);
        console.log(
          "🚀 ~ file: handler.ts ~ line 38 ~ stringify ~ output",
          output
        );
        resolve(output);
        // fs.writeFile(__dirname+'/weekProducts.csv', output);
      });
    }).then((csvString) => {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/csv",
          "Access-Control-Allow-Origin": "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
          "Content-Disposition": 'attachment; filename="weekProducts.csv"',
        },
        body: csvString,
      };
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
const getEntryFromProduct = (
  title: string,
  id: string,
  date: string,
  quantity: number,
  upcomingDates
) => {
  const entry = {
    id,
    title,
  };
  upcomingDates.forEach((d) => {
    entry[d] = 0;
  });
  if (date) entry[date] = quantity;
  return entry;
};
const formatDate = (date: Date) => {
  const day = date.toLocaleString("default", { day: "2-digit" });
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.toLocaleString("default", { year: "numeric" });
  return `${month} ${day} ${year}`;
};
const getUpcomingDates = () => {
  let upcongDates: string[] = [];
  const date = new Date();
  for (let i = 0; i < 7; i++) {
    upcongDates = [...upcongDates, formatDate(date)];
    date.setDate(date.getDate() + 1);
  }
  return upcongDates;
};

const getProducts = (order: Shopify.IOrder, date: string) => {
  const productCount = [];
  // console.log("REFUNDS", order.refunds.map(r => r.refund_line_items));
  const refunds = order.refunds.map(refund => refund.refund_line_items.map(lineItem => lineItem.line_item_id)).flat();
  order.line_items.forEach((lineItem) => {
    // console.log("LINE ITEM", lineItem.id)
    if (refunds.includes(lineItem.id)) {
      console.log("WE GOT A REFUND", refunds);
      return;
    }
    const index = productCount.findIndex(
      (prod) => prod.id === lineItem.product_id
    );
    if (index !== -1) {
      console.log("pushed here")
      productCount[index].quantity += lineItem.quantity;
    } else {
      productCount.push({
        id: lineItem.product_id,
        quantity: lineItem.quantity,
        title: lineItem.title,
        date,
      });
    }
  });
  return productCount;
};
export const main = middyfy(handler);

const checkIfDateIncluded = (upcomingDates: string[], tags) => {
  for (const date of upcomingDates) {
    if (tags.includes(date)) {
      return date;
    }
  }
  return false;
}
