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

export const formatJSONResponse = (response: Record<string, unknown>) => {
  console.log("RESPONSE SENT:", response);
  return {
    statusCode: 200,
    body: JSON.stringify(response),
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
