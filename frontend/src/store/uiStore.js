import { create } from "zustand";

const useUiStore = create((set) => ({
  toast: null,
  showToast: (message, type = "info") => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 4000);
  },
  clearToast: () => set({ toast: null }),
}));

export default useUiStore;
