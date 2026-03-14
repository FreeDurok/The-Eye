import client from "./client.js";

export const createCase = (name, description = null) =>
  client.post("/cases", { name, description }).then((r) => r.data);

export const listCases = (page = 1, pageSize = 20, status = null) => {
  const params = { page, page_size: pageSize };
  if (status) params.status = status;
  return client.get("/cases", { params }).then((r) => r.data);
};

export const getCase = (id) => client.get(`/cases/${id}`).then((r) => r.data);

export const updateCase = (id, data) =>
  client.put(`/cases/${id}`, data).then((r) => r.data);

export const deleteCase = (id) => client.delete(`/cases/${id}`);

export const exportCase = async (id) => {
  const response = await client.get(`/cases/${id}/export`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `case-${id}.zip`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importCase = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return client
    .post("/cases/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
