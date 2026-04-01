// 2026-04-01 10:00
export function getStepOpacity(progress, start, end) {
    if (progress < start) return 0

    const fadeRange = (end - start) * 0.2
    const fadeProgress = (progress - start) / fadeRange

    return Math.min(fadeProgress, 1)
}