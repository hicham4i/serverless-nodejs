export default {
  timeout: 30,
  handler: `${__dirname
    .split(process.cwd())[1]
    .substring(1)
    .replace(/\\/g, "/")}/handler.main`,
  events: [
    {
      http: {
        method: "post",
        path: "boldWebhookOrderFailed",
      },
    },
  ],
};
