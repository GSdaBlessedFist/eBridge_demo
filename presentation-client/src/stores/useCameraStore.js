// src/stores/useCameraStore.js
import { create } from 'zustand'

export const useCameraStore = create((set) => ({
    currentCamera: null,
    setCamera: (cam) => set({ currentCamera: cam }),
}))