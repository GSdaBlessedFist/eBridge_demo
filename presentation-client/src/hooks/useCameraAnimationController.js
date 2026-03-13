// 2026-03-06 16:25
import * as THREE from "three"
import { useAnimations } from '@react-three/drei'
import { useRef } from 'react'

export function useCameraAnimationController(actions) {
    const currentCameraAction = useRef(null)

    const play = (name) => {
        const action = actions[name]
        if (!action) return

        const isCameraZoom = name.toLowerCase().endsWith('zoom')
        if (isCameraZoom) {
            if (currentCameraAction.current && currentCameraAction.current !== action) {
                currentCameraAction.current.stop()
            }
            currentCameraAction.current = action

            action.loop = THREE.LoopOnce
            action.clampWhenFinished = true

            // Snap to first frame
            action.reset().play()  // time = 0
        } else {
            // non-camera actions can fade in
            action.reset().fadeIn(0.3).play()
        }
    }

    return { play, actions }
}
