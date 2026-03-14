import client from "./client.js";

export const getOverview = () => client.get("/stats/overview").then((r) => r.data);
export const getTimeline = (days = 30) =>
  client.get("/stats/timeline", { params: { days } }).then((r) => r.data);
export const getModuleBreakdown = () =>
  client.get("/stats/modules").then((r) => r.data);
