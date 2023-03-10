import "source-map-support/register";

import type { TypedEventHandler } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import { WebhookSubscriptionOrderCreatedEvent, BoldAPI } from "@libs/boldApi";
import { env } from "../../env";

const handler: TypedEventHandler<WebhookSubscriptionOrderCreatedEvent> = async (
  event
) => {
  try {
    // const handler = async (event) => {
    console.log(event);
    console.error(event);
    console.error("[ERROR]: something wrong with payment happened");
    const shopIdentifier = "27393687639";
    const bold = new BoldAPI(env.BOLD_ACCESS_TOKEN, shopIdentifier);
    console.log(bold);
    const res = await bold.webhooks.getWebhookTopics();
    console.log(res);
    return formatJSONResponse({
      message: "ok",
    });
  } catch (err) {
    console.error(err);
    return formatJSONResponse({
      message: "ok",
    });
  }
};

export const main = middyfy(handler);
