// 2026-04-01 10:40
import { useRef } from 'react'
import * as THREE from 'three'
import colorMap from '@/components/colorMap'

export function useVoteAnimationController(materials) {
    const refs = {
        red: useRef(),
        green: useRef(),
        blue: useRef(),
    }

    const pressed = useRef({
        red: false,
        green: false,
        blue: false,
    })

    const flash = useRef({
        red: false,
        green: false,
        blue: false,
    })

    const lerpFactor = 0.136

    function animateMorph(mesh, isPressed) {
        if (!mesh?.morphTargetInfluences) return
        const index = mesh.morphTargetDictionary['Key 1']
        if (index === undefined) return

        mesh.morphTargetInfluences[index] +=
            (isPressed ? 1 : 0 - mesh.morphTargetInfluences[index]) * lerpFactor
    }

    const baseColor = new THREE.Color().copy(materials.buttonBorder.color)
    function update() {
        //console.log("[Animation] update running")  // <-- ADD THIS
        Object.keys(refs).forEach((color) => {
            const mesh = refs[color].current
            if (!mesh) return

            animateMorph(mesh, pressed.current[color])

            const targetColor = flash.current[color]
                ? colorMap[color]
                : baseColor

            const temp = new THREE.Color().copy(targetColor)
            mesh.material.color.lerp(temp, 0.1)

            const targetIntensity = flash.current[color] ? 2 : 0.5
            mesh.material.emissiveIntensity +=
                (targetIntensity - mesh.material.emissiveIntensity) * 0.1

            mesh.material.needsUpdate = true
            //console.log("[Animation] flash state:", color, flash.current[color])
        })
    }

    function triggerFlash(color, duration = 550) {
        console.log("[Animation] triggerFlash called for", color)  // <-- ADD THIS
        // reset everything
        Object.keys(pressed.current).forEach(c => (pressed.current[c] = false))
        Object.keys(flash.current).forEach(c => (flash.current[c] = false))

        // set active color
        pressed.current[color] = true
        flash.current[color] = true

        // schedule reset
        setTimeout(() => {
            pressed.current[color] = false
            flash.current[color] = false
        }, duration)
    }

    return {
        refs,
        pressed,
        flash,
        update,
        triggerFlash
    }
}

