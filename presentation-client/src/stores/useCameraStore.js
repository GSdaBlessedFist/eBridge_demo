// src/stores/useCameraStore.js
import { create } from 'zustand'

export const useCameraStore = create((set) => ({
    currentCamera: "overview",
    setCamera: (cam) => set({ currentCamera: cam }),
    playConfigAnimation: false,
    triggerConfigAnimation: () => set({ playConfigAnimation: true }),
    clearConfigAnimation: () => set({ playConfigAnimation: false })
}))
