// 2026-03-13 15:05
import { useCameraStore } from '@/stores/useCameraStore'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'

export default function CameraManager({ triggerFade }) {
    const { scene, set } = useThree()
    const currentCameraKey = useCameraStore((state) => state.currentCamera)

    // Registry maps friendly keys → Three.js camera names
    const cameraRegistry = useMemo(() => ({
        overview: "_Overview_Camera_1",
        metrics: "_LiveMetrics_Camera_1",
        demoMenu: "_DemoMenu_Camera_1",
        power: "_PowerButton_Camera_1",
        scale: "_Scale_Camera_1",
        roam: "_ROAM_Camera",
    }), [])

    useEffect(() => {
        if (!currentCameraKey) return

        const camName = cameraRegistry[currentCameraKey]
        const cam = scene.getObjectByName(camName)

        if (!cam) {
            console.warn(`Camera "${camName}" not found`)
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