// src/stores/useCameraStore.js
import { create } from 'zustand'

// 2026-04-24 18:42
export const useCameraStore = create((set) => ({
    currentCamera: "overview",
    setCamera: (cam) => set({ currentCamera: cam }),

    // ▶️ Forward animation
    playConfigAnimation: false,
    triggerConfigAnimation: () => set({ playConfigAnimation: true }),
    clearConfigAnimation: () => set({ playConfigAnimation: false }),

    // 🔁 Reset animation (NEW)
    resetConfigAnimation: false,
    triggerResetConfigAnimation: () => set({ resetConfigAnimation: true }),
    clearResetConfigAnimation: () => set({ resetConfigAnimation: false }),
}))