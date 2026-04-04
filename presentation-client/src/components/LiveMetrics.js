
// 2026-03-04 23:15
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVoteStore } from '../stores/useVoteStore'
import colorMap from './colorMap'
import { useCameraStore } from '@/stores/useCameraStore'
import * as THREE from "three"

// export default function LiveMetrics({ nodes, materials, powerOn }) {

export default function LiveMetrics({ nodes, materials, powerOn }) {
    const currentCamera = useCameraStore((state) => state.currentCamera)

    const barRefs = {
        red: useRef(),
        green: useRef(),
        blue: useRef(),
    }

    // Store current displayed height for smooth lerp
    const displayHeight = useRef({ red: 0, green: 0, blue: 0 }).current
    const lerpFactor = 0.08
    const maxHeight = 1
    const maxEmissive = 2

    // Reset bars immediately when power toggles off
    useEffect(() => {
        if (!powerOn) {
            Object.keys(barRefs).forEach((color) => {
                const mesh = barRefs[color].current
                if (!mesh) return
                mesh.scale.y = 0
                mesh.material.emissiveIntensity = 0
                displayHeight[color] = 0
            })
        }
    }, [powerOn])

    // Fade bars in/out based on camera
    useEffect(() => {
        const visible = currentCamera === "metrics" ? 1 : 0
        Object.values(barRefs).forEach(b => {
            if (!b.current) return
            b.current.material.opacity = visible
        })
    }, [currentCamera])

    // useEffect(() => { console.log("barRefs.blue.current.material.emissiveIntensity: ", barRefs.blue.current.material.emissiveIntensity) }, [])
    // useEffect(() => { console.log("barRefs.blue.current.material.emissiveIntensity(after): ", barRefs.blue.current.material.emissiveIntensity) }, [barRefs])

    // Animate bars frame-by-frame
    const neutralColor = new THREE.Color(0.2, 0.2, 0.2) // soft grey
    useFrame(() => {
        if (!powerOn) return
        const { percentages, consensusColor } = useVoteStore.getState()

        Object.keys(barRefs).forEach(color => {
            const mesh = barRefs[color].current
            if (!mesh) return

            const target = (percentages[color] || 0) / 100
            // Smooth lerp
            displayHeight[color] += (target - displayHeight[color]) * lerpFactor
            mesh.scale.y = displayHeight[color] * maxHeight

            // Emissive intensity
            // const intensityFactor = consensusColor === color ? 5 : displayHeight[color]
            // mesh.material.emissive.copy(colorMap[color])

            // mesh.material.emissiveIntensity =
            //     consensusColor === color
            //         ? 5   // 🔥 obvious boost
            //         : displayHeight[color] * maxEmissive

            const t = displayHeight[color] // already 0 → 1

            const blended = neutralColor.clone().lerp(colorMap[color], t)

            mesh.material.color.copy(blended)
            mesh.material.emissive.copy(blended)
            mesh.material.emissiveIntensity = 2

            mesh.material.emissiveIntensity =
                consensusColor === color
                    ? 1.25  // 🔥 highlight winner
                    : .25

            mesh.material.needsUpdate = true
        })
    })

    return (
        <group name="LiveMetrics">
            <mesh ref={barRefs.red} geometry={nodes.liveMetricBar_1.geometry} position={[-0.001, 1.098, 0.303]} castShadow receiveShadow>
                <meshStandardMaterial attach="material" transparent opacity={0} color={colorMap.red} metalness={0.6} roughness={0.4} emissive={colorMap.red} emissiveIntensity={0} />
            </mesh>
            <mesh ref={barRefs.green} geometry={nodes.liveMetricBar_2.geometry} position={[-0.001, 1.098, -0.134]} castShadow receiveShadow>
                <meshStandardMaterial attach="material" transparent opacity={0} color={colorMap.green} metalness={0.6} roughness={0.4} emissive={colorMap.green} emissiveIntensity={0} />
            </mesh>
            <mesh ref={barRefs.blue} geometry={nodes.liveMetricBar_3.geometry} position={[-0.001, 1.098, -0.57]} castShadow receiveShadow>
                <meshStandardMaterial attach="material" transparent opacity={0} color={colorMap.blue} metalness={0.6} roughness={0.4} emissive={colorMap.blue} emissiveIntensity={0} />
            </mesh>
        </group>
    )
}