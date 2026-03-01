// 2026-02-24 11:40
import { useFrame } from '@react-three/fiber'
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
    const maxHeight = 2

    useFrame(() => {
        const percentages = useVoteStore.getState().percentages

        Object.keys(barRefs).forEach((color) => {
            currentScale[color] += (percentages[color] - currentScale[color]) * lerpFactor
            if (barRefs[color].current) {
                barRefs[color].current.scale.y = currentScale[color] * maxHeight
            }
        })

        const consensusColor = useVoteStore.getState().consensusColor

        if (consensusColor) {
            // trigger special effect using consensusColor
        }
    })

    return (
        <group name="LiveMetrics">
            <mesh
                ref={barRefs.red}
                name="liveMetricBar_1"
                geometry={nodes.liveMetricBar_1.geometry}
                position={[-0.001, 1.097, 0.303]}
                material={materials.liveMetricBar_1}
                castShadow receiveShadow
            />
            <mesh
                ref={barRefs.green}
                name="liveMetricBar_2"
                geometry={nodes.liveMetricBar_2.geometry}
                position={[-0.001, 1.097, -0.134]}
                material={materials.liveMetricBar_2}
                castShadow receiveShadow
            />
            <mesh
                ref={barRefs.blue}
                name="liveMetricBar_3"
                geometry={nodes.liveMetricBar_3.geometry}
                position={[-0.001, 1.097, -0.57]}
                material={materials.liveMetricBar_3}
                castShadow receiveShadow
            />
        </group>
    )
}

