// src/stores/useCameraStore.js
import { create } from 'zustand'

export const useCameraStore = create((set) => ({
    currentCamera: "overview",
    setCamera: (cam) => set({ currentCamera: cam }),
}))
