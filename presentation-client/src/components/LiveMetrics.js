// 2026-02-24 11:40
// import { useFrame } from '@react-three/fiber'
// import * as THREE from "three"
// import { useEffect, useRef } from 'react'
// import { useVoteStore } from '../stores/useVoteStore'
// import colorMap from './colorMap'

// export default function LiveMetrics({ nodes, materials, powerOn }) {
//     const barRefs = {
//         red: useRef(),
//         green: useRef(),
//         blue: useRef(),
//     }

//     const currentScale = useRef({ red: 0, green: 0, blue: 0 }).current
//     const lerpFactor = 0.1
//     const maxHeight = 1

//     // Subscribe to vote state once
//     const percentages = useVoteStore((state) => state.percentages)
//     const consensusColor = useVoteStore((state) => state.consensusColor)

//     const maxEmissive = 2;

//     useFrame(() => {
//         if (!powerOn) return

//         const { percentages, consensusColor } = useVoteStore.getState()

//         Object.keys(barRefs).forEach((color) => {
//             const mesh = barRefs[color].current
//             if (!mesh) return

//             // --- Height animation ---
//             const targetScale = (percentages[color] || 0) / 100
//             currentScale[color] += (targetScale - currentScale[color]) * lerpFactor
//             mesh.scale.y = currentScale[color] * maxHeight

//             // --- Emissive animation ---

//             // Intensity factor: 1 for consensus, otherwise scale by percentage
//             let intensityFactor = targetScale
//             if (consensusColor === color) intensityFactor = 1

//             // Apply maxEmissive cap
//             const finalColor = colorMap[color].clone().multiplyScalar(intensityFactor * maxEmissive)

//             mesh.material.emissive.copy(finalColor)
//             mesh.material.needsUpdate = true
//         })
//     })

//     return (
//         <group name="LiveMetrics">
//             <mesh ref={barRefs.red} geometry={nodes.liveMetricBar_1.geometry} position={[-0.001, 1.097, 0.303]} castShadow receiveShadow>
//                 <meshStandardMaterial attach="material" color={colorMap.red} metalness={0.6} roughness={0.4} emissive={colorMap.red} emissiveIntensity={0} />
//             </mesh>
//             <mesh ref={barRefs.green} geometry={nodes.liveMetricBar_2.geometry} position={[-0.001, 1.097, -0.134]} castShadow receiveShadow>
//                 <meshStandardMaterial attach="material" color={colorMap.green} metalness={0.6} roughness={0.4} emissive={colorMap.green} emissiveIntensity={0} />
//             </mesh>
//             <mesh ref={barRefs.blue} geometry={nodes.liveMetricBar_3.geometry} position={[-0.001, 1.097, -0.57]} castShadow receiveShadow>
//                 <meshStandardMaterial attach="material" color={colorMap.blue} metalness={0.6} roughness={0.4} emissive={colorMap.blue} emissiveIntensity={0} />
//             </mesh>
//         </group>
//     )
// }

// 2026-03-04 23:15
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVoteStore } from '../stores/useVoteStore'
import colorMap from './colorMap'

export default function LiveMetrics({ nodes, materials, powerOn }) {
    const barRefs = {
        red: useRef(),
        green: useRef(),
        blue: useRef(),
    }

    const currentScale = useRef({ red: 0, green: 0, blue: 0 }).current
    const lerpFactor = 0.1
    const maxHeight = 1
    const maxEmissive = 2
    const flashDuration = 300  // Optional: used if you want temporary vote flashes

    // Reset bars immediately when power toggles off
    useEffect(() => {
        if (!powerOn) {
            Object.keys(barRefs).forEach((color) => {
                const mesh = barRefs[color].current
                if (!mesh) return
                mesh.scale.y = 0
                mesh.material.emissiveIntensity = 0
                currentScale[color] = 0
            })
        }
    }, [powerOn])

    useFrame(() => {
        if (!powerOn) return  // Block flares / updates if system is off

        const { percentages, consensusColor } = useVoteStore.getState()

        Object.keys(barRefs).forEach((color) => {
            const mesh = barRefs[color].current
            if (!mesh) return

            // --- Height animation ---
            const targetScale = (percentages[color] || 0) / 100
            currentScale[color] += (targetScale - currentScale[color]) * lerpFactor
            mesh.scale.y = currentScale[color] * maxHeight

            // --- Emissive animation ---
            let intensityFactor = targetScale
            if (consensusColor === color) intensityFactor = 1

            const finalColor = colorMap[color].clone().multiplyScalar(intensityFactor * maxEmissive)
            mesh.material.emissive.copy(finalColor)
            mesh.material.needsUpdate = true
        })
    })

    return (
        <group name="LiveMetrics">
            <mesh ref={barRefs.red} geometry={nodes.liveMetricBar_1.geometry} position={[-0.001, 1.097, 0.303]} castShadow receiveShadow>
                <meshStandardMaterial attach="material" color={colorMap.red} metalness={0.6} roughness={0.4} emissive={colorMap.red} emissiveIntensity={0} />
            </mesh>
            <mesh ref={barRefs.green} geometry={nodes.liveMetricBar_2.geometry} position={[-0.001, 1.097, -0.134]} castShadow receiveShadow>
                <meshStandardMaterial attach="material" color={colorMap.green} metalness={0.6} roughness={0.4} emissive={colorMap.green} emissiveIntensity={0} />
            </mesh>
            <mesh ref={barRefs.blue} geometry={nodes.liveMetricBar_3.geometry} position={[-0.001, 1.097, -0.57]} castShadow receiveShadow>
                <meshStandardMaterial attach="material" color={colorMap.blue} metalness={0.6} roughness={0.4} emissive={colorMap.blue} emissiveIntensity={0} />
            </mesh>
        </group>
    )
}