// 2026-04-21 16:10
import { useCameraStore } from '@/stores/useCameraStore'
import { useVoteStore } from '@/stores/useVoteStore'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

export default function CameraManager({ triggerFade }) {
    const { scene, set } = useThree()
    const { animations } = useGLTF('/models/eBridgeDemo_theThing.glb')

    const { actions } = useAnimations(animations, scene)

    const currentCameraKey = useCameraStore((state) => state.currentCamera)
    const playConfigAnimation = useCameraStore((s) => s.playConfigAnimation)
    const clearConfigAnimation = useCameraStore((s) => s.clearConfigAnimation)

    const [hasMounted, setHasMounted] = useState(false)

    // -----------------------------
    // 📌 CAMERA REGISTRY
    // -----------------------------
    const cameraRegistry = useMemo(() => ({
        overview: "_Overview_Camera_1",
        metrics: "_LiveMetrics_Camera_1",
        demoMenu: "_DemoMenu_Camera_1",
        power: "_PowerButton_Camera_1",
        scale: "_Scale_Camera_1",
        assembly: "_Assembly_Camera_1",
        config: "_Config_Camera_1"
    }), [])

    const animateConfigCamera = (cam) => {
        const start = cam.position.clone()

        const end = new THREE.Vector3(
            // 0.05188,
            0,
            // -3.80567,
            6,
            2.55
        )

        const duration = 6200 // ms
        const startTime = performance.now()

        const tick = (time) => {
            const t = Math.min((time - startTime) / duration, 1)

            // smooth easing (nice default)
            const ease = t * (2 - t)

            cam.position.lerpVectors(start, end, ease)

            if (t < 1) {
                requestAnimationFrame(tick)
            }
        }

        requestAnimationFrame(tick)
    }

    useEffect(() => {
        if (!playConfigAnimation) return
        if (currentCameraKey !== "config") return

        const camName = cameraRegistry["config"]
        const cam = scene.getObjectByName(camName)

        if (!cam) return

        animateConfigCamera(cam)
        clearConfigAnimation()

    }, [playConfigAnimation, currentCameraKey, scene])

    // -----------------------------
    // 📷 CAMERA SWITCHING
    // -----------------------------
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