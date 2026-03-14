import { create } from "zustand";

const useExportStore = create((set) => ({
  queryId: null,
  resultId: null,
  selectedFields: [],
  format: "json",
  setIds: (queryId, resultId) => set({ queryId, resultId }),
  setSelectedFields: (fields) => set({ selectedFields: fields }),
  setFormat: (format) => set({ format }),
  loadProfile: (profile) =>
    set({ selectedFields: profile.fields, format: profile.format }),
  reset: () => set({ queryId: null, resultId: null, selectedFields: [], format: "json" }),
}));

export default useExportStore;
