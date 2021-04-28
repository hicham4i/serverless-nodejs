import { default as shopifyWebhook } from "./shopifyWebhook";
import { default as getProducts } from "./getProducts";
import { default as updateProducts } from "./updateProducts";
import { default as boldWebhookSubscriptionCreated } from "./boldWebhookSubscriptionCreated";
import { default as boldWebhookSubscriptionOrderCreated } from "./boldWebhookSubscriptionOrderCreated";
import { default as showAllProducts } from "./showAllProducts";

export const functions = {
  shopifyWebhook,
  getProducts,
  updateProducts,
  boldWebhookSubscriptionCreated,
  boldWebhookSubscriptionOrderCreated,
  showAllProducts,
};
