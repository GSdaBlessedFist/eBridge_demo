

// 2026-03-04 23:15
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVoteStore } from '../stores/useVoteStore'
import colorMap from './colorMap'
import { useCameraStore } from '@/stores/useCameraStore'

export default function LiveMetrics({ nodes, materials, powerOn }) {
    const currentCamera = useCameraStore((state) => state.currentCamera)
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

    useEffect(() => {
        if (currentCamera == "metrics") {
            Object.values(barRefs).forEach(b => b.current.material.opacity = 1)
        } else {
            Object.values(barRefs).forEach(b => b.current.material.opacity = 0)
        }
    }, [currentCamera])

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