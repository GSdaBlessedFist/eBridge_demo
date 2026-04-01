// 2026-03-13 15:05
import { useCameraStore } from '@/stores/useCameraStore'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'

export default function CameraManager({ triggerFade }) {
    const { scene, set } = useThree()
    const currentCameraKey = useCameraStore((state) => state.currentCamera)
    const [hasMounted, setHasMounted] = useState(false)

    // Registry maps friendly keys → Three.js camera names
    const cameraRegistry = useMemo(() => ({
        overview: "_Overview_Camera_1",
        metrics: "_LiveMetrics_Camera_1",
        demoMenu: "_DemoMenu_Camera_1",
        power: "_PowerButton_Camera_1",
        scale: "_Scale_Camera_1",
        assembly: "_Assembly_Camera_1",
        config: "_Config_Camera_1"
    }), [])

    useEffect(() => {
        if (!currentCameraKey) {
            console.error("🚨 currentCameraKey is invalid:", currentCameraKey)
            return
        }

        const camName = cameraRegistry[currentCameraKey]
        const cam = scene.getObjectByName(camName)

        if (!cam) {
            console.warn(`Camera "${camName}" not found`)
            return
        }

        // Skip fade on first mount
        if (!hasMounted) {
            set({ camera: cam })
            setHasMounted(true)
            return
        }

        if (!triggerFade) {
            console.warn("Fade system not ready, switching instantly")
            set({ camera: cam })
            return
        }

        triggerFade(() => {
            console.log("Switching camera to:", cam.name)
            set({ camera: cam })
        })

    }, [currentCameraKey, cameraRegistry, scene, set, triggerFade])

    return null
}