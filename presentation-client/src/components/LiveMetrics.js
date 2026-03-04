// 2026-02-24 11:40
import { useFrame } from '@react-three/fiber'
import * as THREE from "three"
import { useEffect, useRef } from 'react'
import { useVoteStore } from '../stores/useVoteStore'

export default function LiveMetrics({ nodes, materials }) {
    const barRefs = {
        red: useRef(),
        green: useRef(),
        blue: useRef(),
    }

    const currentScale = useRef({ red: 0, green: 0, blue: 0 }).current
    const lerpFactor = 0.1
    const maxHeight = 1

    // Subscribe to vote state once
    const percentages = useVoteStore((state) => state.percentages)
    const consensusColor = useVoteStore((state) => state.consensusColor)

    const maxEmissive = 2;

    // useFrame(() => {
    //     const { percentages, consensusColor } = useVoteStore.getState()

    //     Object.keys(barRefs).forEach((color) => {
    //         const mesh = barRefs[color].current
    //         if (!mesh) return

    //         const targetScale = (percentages[color] || 0) / 100
    //         currentScale[color] += (targetScale - currentScale[color]) * lerpFactor
    //         mesh.scale.y = currentScale[color] * maxHeight

    //         // Base emissive intensity from vote percentage
    //         let targetEmissive = targetScale * maxEmissive

    //         // If this color is the consensus, override to max
    //         if (consensusColor === color) targetEmissive = maxEmissive

    //         // Smoothly lerp emissive intensity
    //         mesh.material.emissiveIntensity += (targetEmissive - mesh.material.emissiveIntensity) * 0.1
    //         mesh.material.needsUpdate = true
    //     })
    // })
    useFrame(() => {
        const { percentages, consensusColor } = useVoteStore.getState()

        Object.keys(barRefs).forEach((color) => {
            const mesh = barRefs[color].current
            if (!mesh) return

            // --- Height animation ---
            const targetScale = (percentages[color] || 0) / 100
            currentScale[color] += (targetScale - currentScale[color]) * lerpFactor
            mesh.scale.y = currentScale[color] * maxHeight

            // --- Emissive animation ---
            // Base color for each bar
            const baseColor = new THREE.Color(color)

            // Intensity factor: 1 for consensus, otherwise scale by percentage
            let intensityFactor = targetScale
            if (consensusColor === color) intensityFactor = 1

            // Apply maxEmissive cap
            const finalColor = baseColor.clone().multiplyScalar(intensityFactor * maxEmissive)

            mesh.material.emissive.copy(finalColor)
            mesh.material.needsUpdate = true
        })
    })

    return (
        <group name="LiveMetrics">
            <mesh ref={barRefs.red} geometry={nodes.liveMetricBar_1.geometry} position={[-0.001, 1.097, 0.303]} castShadow receiveShadow>
                <meshStandardMaterial attach="material" color="red" metalness={0.6} roughness={0.4} emissive="red" emissiveIntensity={0} />
            </mesh>
            <mesh ref={barRefs.green} geometry={nodes.liveMetricBar_2.geometry} position={[-0.001, 1.097, -0.134]} castShadow receiveShadow>
                <meshStandardMaterial attach="material" color="green" metalness={0.6} roughness={0.4} emissive="green" emissiveIntensity={0} />
            </mesh>
            <mesh ref={barRefs.blue} geometry={nodes.liveMetricBar_3.geometry} position={[-0.001, 1.097, -0.57]} castShadow receiveShadow>
                <meshStandardMaterial attach="material" color="blue" metalness={0.6} roughness={0.4} emissive="blue" emissiveIntensity={0} />
            </mesh>
        </group>
    )
}

