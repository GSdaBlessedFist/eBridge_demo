// 2026-04-01 12:15

const listeners = new Set();

export function emit(event) {
    console.log("[EventBus]", event);

    listeners.forEach((cb) => cb(event));
}

export function on(callback) {
    listeners.add(callback);

    return () => {
        listeners.delete(callback);
    };
}