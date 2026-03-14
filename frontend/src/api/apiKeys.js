import client from "./client.js";

export const getApiKeyStatus = () =>
  client.get("/api-keys/status").then((r) => r.data);
