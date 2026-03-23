
// 2026-03-03 21:15
import { useCallback, useRef } from 'react'
import { useVoteStore } from '../stores/useVoteStore'
import { useFrame } from '@react-three/fiber'
import { usePresentationSocket } from '@/hooks/usePresentationSocket'
import colorMap from './colorMap'
import { useCameraStore } from '@/stores/useCameraStore'

export default function VoteButtons({ nodes, materials, powerOn }) {
    const { castVote, resetVotes } = usePresentationSocket("room-123")
    const currentCamera = useCameraStore((state) => state.currentCamera)

    // refs for GLTF meshes
    const refs = {
        red: useRef(),
        green: useRef(),
        blue: useRef(),
    }

    // morph & flash state
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
    const flashDuration = 150

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

            // Morph target animation
            animateMorph(mesh, pressed.current[color])

            // Emissive: base neutral, flash to bar color if pressed
            const targetColor = flash.current[color] ? colorMap[color] : materials.buttonBorder.color
            mesh.material.color.lerp(mesh.material.color.set(targetColor), 0.1)

            // Emissive intensity
            const targetIntensity = flash.current[color] ? 2 : 0.5
            mesh.material.emissiveIntensity += (targetIntensity - mesh.material.emissiveIntensity) * 0.1
            mesh.material.needsUpdate = true
        })
    })

    const handleClick = useCallback((color) => {
        if (!powerOn) return
        castVote(color)
        console.log("Emitting vote:", color)

        // reset morph & flash states
        Object.keys(pressed.current).forEach((c) => (pressed.current[c] = false))
        Object.keys(flash.current).forEach((c) => (flash.current[c] = false))

        pressed.current[color] = true
        flash.current[color] = true

        setTimeout(() => {
            pressed.current[color] = false
            flash.current[color] = false
        }, flashDuration)
    }, [powerOn])

    return (
        <group name="Module_UIButtons">
            <primitive object={nodes.uiButtonsBorder_1} />
            <primitive object={nodes.uiButtonsBorder_2} />
            <primitive ref={refs.red} object={nodes.uiButton_1} onClick={(e) => { e.stopPropagation(); handleClick('red') }} />
            <primitive ref={refs.green} object={nodes.uiButton_2} onClick={(e) => { e.stopPropagation(); handleClick('green') }} />
            <primitive ref={refs.blue} object={nodes.uiButton_3} onClick={(e) => { e.stopPropagation(); handleClick('blue') }} />
            <mesh name="uiButtonsIOLights" castShadow receiveShadow geometry={nodes.uiButtonsIOLights.geometry} material={materials.mainScreenIOLights} position={[1.093, 0.965, 0.309]} rotation={[0, 0, -Math.PI]} scale={[-0.074, -1, -0.02]} userData={{ name: 'uiButtonsIOLights' }} />
        </group>
    )
}

