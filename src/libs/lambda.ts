import middy from "@middy/core";
import middyJsonBodyParser from "@middy/http-json-body-parser";
import inputOutputLogger from "@middy/input-output-logger";

export const middyfy = (handler) => {
  return middy(handler).use(inputOutputLogger()).use(middyJsonBodyParser());
};
