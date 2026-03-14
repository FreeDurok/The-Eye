import client from "./client.js";

export const exportData = async (resultId, fields, format) => {
  const response = await client.post(
    "/export",
    { result_id: resultId, fields, format },
    { responseType: "blob" }
  );
  const ext = { json: "json", csv: "csv", excel: "xlsx" }[format];
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `export.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

export const listProfiles = () =>
  client.get("/export/profiles").then((r) => r.data);

export const saveProfile = (name, format, fields) =>
  client.post("/export/profiles", { name, format, fields }).then((r) => r.data);

export const updateProfile = (id, name, format, fields) =>
  client.put(`/export/profiles/${id}`, { name, format, fields }).then((r) => r.data);

export const deleteProfile = (id) =>
  client.delete(`/export/profiles/${id}`);
