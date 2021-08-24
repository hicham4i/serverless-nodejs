import axios, { AxiosRequestConfig } from "axios";
export class BoldAPI {
  token: string;
  shopIdentifier: string;
  frontEndRequest: boolean;

  subscriptions = {
    get: (
      subscriptionId: number,
      shopIdentifier?: string
    ): Promise<Subscription> => {
      return this.makeBoldRequest(
        "get",
        `subscriptions/${subscriptionId}`,
        undefined,
        shopIdentifier
      ).then((res) => res.subscription);
    },

    partialUpdate: (
      subscriptionId: number,
      updateData: Partial<Omit<Subscription, "id">>,
      shopIdentifier?: string
    ): Promise<Subscription> => {
      return this.makeBoldRequest(
        "patch",
        `subscriptions/${subscriptionId}`,
        { subscription: updateData },
        shopIdentifier
      ).then((res) => res.subscription);
    },

    updateNextOrderDate: async (
      subscriptionId: number,
      nextDate: string, // isoString without any miliseconds,
      includeFutureOrders: boolean, // option not documented
      shopIdentifier?: string
    ): Promise<Subscription> => {
      return this.makeBoldRequest(
        "put",
        `subscriptions/${subscriptionId}/next_shipping_date`,
        { nextDate, includeFutureOrders },
        shopIdentifier
      ).then((res) => res.subscription);
    },

    listOrders: (
      subscriptionId: number,
      shopIdentifier?: string
    ): Promise<Order[]> => {
      return this.makeBoldRequest(
        "get",
        `subscriptions/${subscriptionId}/orders`,
        undefined,
        shopIdentifier
      ).then((res) => res.subscription_orders);
    },

    listFutureOrders: (
      subscriptionId: number,
      shopIdentifier?: string
    ): Promise<Order[]> => {
      return this.makeBoldRequest(
        "get",
        `subscriptions/${subscriptionId}/future_orders`,
        undefined,
        shopIdentifier
      ).then((res) => res.subscription_orders);
    },

    swapProducts: (
      subscriptionId: number,
      swapProducts: SwapProductArg[],
      shopIdentifier?: string
    ): Promise<Subscription> => {
      return this.makeBoldRequest(
        "put",
        `subscriptions/${subscriptionId}/products_swap`,
        {
          swap_products: swapProducts,
        },
        shopIdentifier
      ).then((res) => res.subscription);
    },
  };

  webhooks = {
    getWebhookTopics: (shopIdentifier?: string): Promise<WebhookTopic[]> => {
      return this.makeBoldRequest(
        "get",
        "webhooks/topics",
        undefined,
        shopIdentifier
      ).then((res) => res.webhook_topics);
    },

    createWebhookSubscription: (
      webhook_subscription: CreateWebhookSubscriptionParam,
      shopIdentifier?: string
    ): Promise<WebhookSubscription> => {
      const shop_id = shopIdentifier || this.shopIdentifier;
      const param = {
        webhook_subscription: { ...webhook_subscription, shop_id },
      };
      return this.makeBoldRequest(
        "post",
        "webhooks/subscriptions",
        param,
        shopIdentifier
      ).then((res) => res.webhook_subscription);
    },

    listWebhookSubscriptions: (
      shopIdentifier?: string
    ): Promise<WebhookSubscription[]> => {
      return this.makeBoldRequest(
        "get",
        "webhooks/subscriptions",
        undefined,
        shopIdentifier
      ).then((res) => res.webhook_subscriptions);
    },
  };
  constructor(
    token: string,
    shopIdentifier?: string, // either string identifier for backend api or shop url for frontend api
    frontEndRequest?: boolean
  ) {
    this.token = token;
    this.shopIdentifier = shopIdentifier;
    this.frontEndRequest = frontEndRequest;
  }

  async makeBoldRequest(
    method: "get" | "post" | "delete" | "put" | "patch",
    endpoint: string, // does not include v1/shops/${shopIdentifier}/ part
    data?: any,
    shopIdentifier?: string
  ) {
    shopIdentifier = shopIdentifier || this.shopIdentifier;
    if (!shopIdentifier) {
      throw new Error(
        "shop identifier needs to be set by constructor or optional parameter"
      );
    }
    const baseUrl = this.frontEndRequest
      ? "https://sub.boldapps.net/api/customer/"
      : `https://api.boldcommerce.com/subscriptions/v1/shops/${shopIdentifier}/`;
    const axiosParam: AxiosRequestConfig = {
      method,
      url: this.frontEndRequest
        ? `${baseUrl}${endpoint}?shop_url=${shopIdentifier}`
        : `${baseUrl}${endpoint}`,
      data,
      headers: {
        accept: "application/json",
        Authorization: this.frontEndRequest
          ? `Bearer ${this.token}`
          : this.token,
      },
    };
    console.debug(axiosParam);
    const res = await axios.request(axiosParam).catch((err) => {
      if (err.response) {
        console.log(err.response.data);
      }
    });
    if (res && res.status === 200) {
      return res.data;
    } else {
      if (res && res.data) {
        console.error(res.data);
      }
    }
  }
}

export type WebhookTopic = {
  id: number;
  topic_name: string;
};

export type WebhookSubscriptionOrderCreatedEvent = {} & Order;
export type LineItem = {
  platform_product_id: string;
  platform_variant_id: string;
  title: string;
  sku: string;
  url: string;
  image: string;
  quantity: number;
  price: number;
  price_charged: number;
  total_tax: number;
  total_tax_charged: number;
  requires_shipping: boolean;
  grams: number;
  weight: number;
  weight_unit: string;
  taxable: boolean;
  created_at: string;
  updated_at: string;
  id: number;
  order_id: number;
  bold_platform_subscription_line_item_id: number;
};
export type Order = {
  id: number;
  subscription_id: number;
  shop_id: number;
  base_to_charged_exchange_rate: number;
  base_currency: string;
  order: {
    platform_id: string;
    platform_customer_id: string;
    shop_identifier: string;
    line_items: LineItem[];
    billing_address: OrderAddress;
    shipping_addresses: OrderAddress[];
    // subtotal: 100;
    // subtotal_charged: 100;
    // subtotal_tax: 0;
    // subtotal_tax_charged: 0;
    // shipping_subtotal: 0;
    // shipping_subtotal_charged: 0;
    // shipping_tax: 0;
    // shipping_tax_charged: 0;
    // total: 100;
    // total_charged: 100;
    // total_tax: 0;
    // total_tax_charged: 0;
    // fulfillment_status: "pending";
    // source: "shopify";
    // payment_method: "shopify_payments";
    // payment_method_details: null;
    // shipping_method: "Subscription shipping";
    // shipping_rates: [];
    // tax_lines: [];
    // discounts: [];
    // order_number: 0;
    // currency: "USD";
    // currency_charged: "USD";
    // currency_format: "${{amount}}";
    // currency_format_charged: "${{amount}}";
    // exchange_rate: 1;
    // test: true;
    // url: "";
    created_at: string;
    updated_at: string;
    placed_at: string;
    deleted_at: string | null;
    id: number;
    subscription_id: number;
  };
  // is_multi_currency: false;
  created_at: string | null;
  updated_at: string | null;
  shop_identifier: string;
};

export type Address = {
  type: "billing" | "shipping";
  first_name: string;
  last_name: string;
  street1: string;
  street2: string;
  company: string;
  city: string;
  province: string;
  country: string;
  country_code: string;
  phone: string;
  postal_code: string;
  email: string;
  created_at: string;
  updated_at: string;
  id: number;
};

export type OrderAddress = Address & {
  order_id: number;
};

export type SubscriptionAddress = Omit<Address, "postal_code"> & {
  shop_identifier: string;
  platform_id: string;
  platform_customer_id: string;
  platform_type: string;
  customer_id: number;
  is_default: false;
  zip: string;
};

export type Subscription = {
  id: number;
  customer: null;
  shop_id: number;
  next_order_datetime: string;
  next_payment_datetime: string;
  next_processing_datetime: string;
  subscription_status: "active" | "inactive" | "paused";
  payment_method_token: string;
  payment_gateway_public_id: null;
  payment_rrule: string;
  payment_rrule_text: string;
  order_rrule: string;
  // order_rrule_text: "daily";
  // last_payment_datetime: string;
  // last_order_datetime: "2021-04-23T07:00:14Z";
  // last_processed_datetime: "2021-04-23T07:00:16Z";
  // current_retries: 0;
  // charged_currency: "USD";
  // base_to_charged_exchange_rate: 1;
  // base_currency: "USD";
  line_items: LineItem[];
  // shipping_lines: null;
  billing_address: SubscriptionAddress;
  shipping_address: SubscriptionAddress;
  // idempotency_key: "7eeb0531-33f1-4686-9511-28a57fb8a318";
  // created_at: "2021-04-22T15:56:51Z";
  // updated_at: "2021-04-23T07:00:16Z";
  // percent_discount: null;
  // discount_code: "";
  note: null | string;
  customer_id: number;
  billing_address_id: number;
  shipping_address_id: number;
};

export type WebhookSubscriptionCreatedEvent = Subscription & {
  shop_identifier: string;
};

export type SwapProductArg = {
  bold_platform_line_item_id: number; // not correctly documented
  platform_product_id: string;
  platform_variant_id: string;
  subscription_group_id: number;
};

export type CreateWebhookSubscriptionParam = {
  callback_url: string;
  shared_secret: string;
  webhook_topic_id: string | number; // It is very important to pass the webhook id as a string
};

export type WebhookSubscription = {
  id: number;
  shop_id: number;
  webhook_topic_id: number;
  callback_url: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export default BoldAPI;
