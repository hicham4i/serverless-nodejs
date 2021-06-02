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
    const shopIdentifier = "27393687639";
    const bold = new BoldAPI(env.BOLD_ACCESS_TOKEN, shopIdentifier);
    console.log(bold);
    const res = await bold.webhooks.getWebhookTopics();
    console.log(res);
    const res2 = await bold.webhooks.listWebhookSubscriptions();
    console.log(res2);
    // const res3 = await bold.webhooks.createWebhookSubscription({
    //   shared_secret: "SuperSecretShared",
    //   webhook_topic_id: "6",
    //   callback_url:
    //     "https://cxph27182g.execute-api.us-east-1.amazonaws.com/prod/boldWebhookOrderFailed",
    // });
    // console.log(res3);
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
