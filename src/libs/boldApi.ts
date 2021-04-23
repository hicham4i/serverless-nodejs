import axios, { AxiosRequestConfig } from "axios";
export class BoldAPI {
  token: string;
  shopIdentifier: string;
  frontEndRequest: boolean;
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

  async getSubscription(
    subscriptionId: number,
    shopIdentifier?: string
  ): Promise<Subscription> {
    return this.makeBoldRequest(
      "get",
      `subscriptions/${subscriptionId}`,
      undefined,
      shopIdentifier
    ).then((res) => res.subscription);
  }

  async partialUpdateSubscription(
    subscriptionId: number,
    updateData: Partial<Omit<Subscription, "id">>,
    shopIdentifier?: string
  ): Promise<Subscription> {
    return this.makeBoldRequest(
      "patch",
      `subscriptions/${subscriptionId}`,
      { subscription: updateData },
      shopIdentifier
    ).then((res) => res.subscription);
  }

  async updateSubscriptionNextOrderDate(
    subscriptionId: number,
    nextDate: string, // isoString
    shopIdentifier?: string
  ): Promise<Subscription> {
    return this.makeBoldRequest(
      "put",
      `subscriptions/${subscriptionId}/next_shipping_date`,
      { nextDate },
      shopIdentifier
    ).then((res) => res.subscription);
  }
}

export type WebhookSubscriptionOrderCreatedEvent = {
  id: number;
  subscription_id: number;
  shop_id: number;
  // base_to_charged_exchange_rate: 1;
  // base_currency: "USD";
  order: {
    platform_id: string;
    platform_customer_id: string;
    shop_identifier: string;
    line_items: {
      platform_product_id: string;
      platform_variant_id: string;
      title: string;
      sku: string;
      url: string;
      image: string;
      quantity: number;
      price: number;
      price_charged: number;
      // total_tax: 0;
      // total_tax_charged: 0;
      // requires_shipping: true;
      // grams: 0;
      // weight: 0;
      // weight_unit: "";
      // taxable: true;
      // created_at: "2021-04-22T15:56:36Z";
      // updated_at: "2021-04-22T15:56:53Z";
      id: number;
      order_id: number;
    }[];
    // billing_address: {
    //   type: "billing";
    //   first_name: "mathis";
    //   last_name: "obadia";
    //   street1: "41 Rue Mediterra Drive";
    //   street2: "";
    //   company: "";
    //   city: "Henderson";
    //   province: "Nevada";
    //   country: "United States";
    //   country_code: "US";
    //   phone: "";
    //   postal_code: "89011";
    //   email: "mathisob@gmail.com";
    //   created_at: "2021-04-22T15:56:36Z";
    //   updated_at: "2021-04-22T15:56:53Z";
    //   id: 224392589;
    //   order_id: 90835576;
    // };
    // shipping_addresses: [
    //   {
    //     type: "shipping";
    //     first_name: "mathis";
    //     last_name: "obadia";
    //     street1: "41 Rue Mediterra Drive";
    //     street2: "";
    //     company: "";
    //     city: "Henderson";
    //     province: "Nevada";
    //     country: "United States";
    //     country_code: "US";
    //     phone: "";
    //     postal_code: "89011";
    //     email: "mathisob@gmail.com";
    //     created_at: "2021-04-22T15:56:36Z";
    //     updated_at: "2021-04-22T15:56:53Z";
    //     id: 224392588;
    //     order_id: 90835576;
    //   }
    // ];
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
    // created_at: "2021-04-22T15:56:37Z";
    // updated_at: "2021-04-22T15:56:53Z";
    // placed_at: "2021-04-22T15:56:30Z";
    // deleted_at: null;
    id: number;
    subscription_id: number;
  };
  // is_multi_currency: false;
  created_at: string | null;
  updated_at: string | null;
  shop_identifier: string;
};

export type Subscription = {
  id: number;
  customer: null;
  shop_id: number;
  next_order_datetime: string;
  next_payment_datetime: string;
  next_processing_datetime: string;
  subscription_status: "active";
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
  // line_items: [[Object]];
  // shipping_lines: null;
  // billing_address: {
  //   shop_identifier: "27393687639";
  //   platform_id: "6285693452375";
  //   platform_customer_id: "5078958866519";
  //   platform_type: "shopify";
  //   first_name: "mathis";
  //   last_name: "obadia";
  //   company: "";
  //   phone: "";
  //   street1: "41 Rue Mediterra Drive";
  //   street2: "";
  //   city: "Henderson";
  //   province: "Nevada";
  //   province_code: "NV";
  //   country: "United States";
  //   country_code: "US";
  //   zip: "89011";
  //   is_default: false;
  //   created_at: null;
  //   updated_at: null;
  //   id: 123165228;
  //   customer_id: 99482146;
  // };
  // shipping_address: {
  //   shop_identifier: "27393687639";
  //   platform_id: "6285693452375";
  //   platform_customer_id: "5078958866519";
  //   platform_type: "shopify";
  //   first_name: "mathis";
  //   last_name: "obadia";
  //   company: "";
  //   phone: "";
  //   street1: "41 Rue Mediterra Drive";
  //   street2: "";
  //   city: "Henderson";
  //   province: "Nevada";
  //   province_code: "NV";
  //   country: "United States";
  //   country_code: "US";
  //   zip: "89011";
  //   is_default: false;
  //   created_at: null;
  //   updated_at: null;
  //   id: 123165228;
  //   customer_id: 99482146;
  // };
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

export default BoldAPI;
