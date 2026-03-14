import client from "./client.js";

export const listModules = () => client.get("/modules").then((r) => r.data);
