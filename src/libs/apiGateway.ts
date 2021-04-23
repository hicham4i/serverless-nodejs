import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import type { FromSchema } from "json-schema-to-ts";

type ValidatedAPIGatewayProxyEvent<S> = Omit<APIGatewayProxyEvent, "body"> & {
  body: FromSchema<S>;
};
export type ValidatedEventAPIGatewayProxyEvent<S> = Handler<
  ValidatedAPIGatewayProxyEvent<S>,
  APIGatewayProxyResult
>;

export type TypedEventHandler<S> = Handler<
  Omit<APIGatewayProxyEvent, "body"> & {
    body: S;
  },
  APIGatewayProxyResult
>;

export const formatJSONResponse = (response: Record<string, unknown>) => {
  console.log("RESPONSE SENT:", response);
  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};

export const formatHTMLResponse = (html: string): APIGatewayProxyResult => {
  console.log("RESPONSE SENT:", html);
  return {
    statusCode: 200,
    body: html,
    headers: {
      "Content-Type": "text/html",
    },
  };
};

export const formatJSONResponseCors = (response: Record<string, unknown>) => {
  console.log("RESPONSE SENT:", response);
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify(response),
  };
};

export const formatJSONResponseError = (response: Record<string, unknown>) => {
  console.log("ERROR SENT:", response);
  return {
    statusCode: 400,
    body: JSON.stringify(response),
  };
};
