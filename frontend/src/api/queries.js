import client from "./client.js";

export const runQuery = (module, query, options = null, caseId = null) => {
  const body = { module, query, options };
  if (caseId) body.case_id = caseId;
  return client.post("/queries", body).then((r) => r.data);
};

export const listQueries = (page = 1, pageSize = 20, module = null) => {
  const params = { page, page_size: pageSize };
  if (module) params.module = module;
  return client.get("/queries", { params }).then((r) => r.data);
};

export const getQuery = (id) =>
  client.get(`/queries/${id}`).then((r) => r.data);

export const deleteQuery = (id) => client.delete(`/queries/${id}`);

export const importFile = (file, query, module, caseId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("query", query);
  if (module) formData.append("module", module);
  if (caseId) formData.append("case_id", caseId);
  return client
    .post("/queries/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    })
    .then((r) => r.data);
};
