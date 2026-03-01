
// 2026-02-24 14:45
import { useEffect, useRef } from 'react'
import { useVoteStore } from '../stores/useVoteStore'
import { useFrame } from '@react-three/fiber'
import { usePresentationSocket } from '@/hooks/usePresentationSocket'

export default function VoteButtons({ nodes, materials }) {
    const { castVote } = usePresentationSocket("room-123")

    // refs for the original GLTF mesh instances
    const refs = {
        red: useRef(),
        green: useRef(),
        blue: useRef(),
    }

    // morph state
    const pressed = useRef({
        red: false,
        green: false,
        blue: false,
    })

    const lerpFactor = .136

    // smoothly animate morph targets each frame
    const animateMorph = (mesh, isPressed) => {
        if (!mesh?.morphTargetInfluences) return
        const index = mesh.morphTargetDictionary['Key 1']
        if (index === undefined) return

        mesh.morphTargetInfluences[index] +=
            (isPressed ? 1 : 0 - mesh.morphTargetInfluences[index]) * lerpFactor
    }

    useFrame(() => {
        Object.keys(refs).forEach((color) => {
            const mesh = refs[color].current
            if (!mesh) return

            // Animate morph target
            animateMorph(mesh, pressed.current[color])

            // Animate emissive intensity while keeping base color
            const targetIntensity = pressed.current[color] ? 2 : 1 // 2 = brighter, 1 = normal
            mesh.material.emissiveIntensity +=
                (targetIntensity - mesh.material.emissiveIntensity) * 0.1
            mesh.material.needsUpdate = true
        })
    })

    const handleClick = (color) => {
        castVote(color) // send vote to server
        console.log("Emitting vote:", color)

        // ensure exclusive press state
        Object.keys(pressed.current).forEach((c) => (pressed.current[c] = false))
        pressed.current[color] = true
        // release after 150ms
        setTimeout(() => {
            pressed.current[color] = false
        }, 150)
    }

    return (
        <group name="Module_UIButtons">
            <primitive
                ref={refs.red}
                object={nodes.uiButton_1}
                onClick={(e) => {
                    e.stopPropagation()
                    handleClick('red')
                }}
            />
            <primitive
                ref={refs.green}
                object={nodes.uiButton_2}
                onClick={(e) => {
                    e.stopPropagation()
                    handleClick('green')
                }}
            />
            <primitive
                ref={refs.blue}
                object={nodes.uiButton_3}
                onClick={(e) => {
                    e.stopPropagation()
                    handleClick('blue')
                }}
            />
        </group>
    )
}

