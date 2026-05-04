// 2026-04-01 12:15

// 2026-04-28 21:31
// src/stores/events/eventBus.js

const listeners = new Set();

export function emit(type, payload = {}) {
    const event = { type, payload }

    console.log("[EventBus emit]", event)

    listeners.forEach((cb) => cb(event))
}

export function on(callback) {
    if (typeof callback !== "function") {
        console.warn("⚠️ Tried to register non-function listener:", callback);
        return () => { };
    }

    listeners.add(callback);

    return () => {
        listeners.delete(callback);
    };
}