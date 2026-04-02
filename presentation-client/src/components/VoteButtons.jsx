
// 2026-03-03 21:15
import { useCallback, useRef } from 'react'
import { useVoteStore } from '../stores/useVoteStore'
import { useFrame } from '@react-three/fiber'
import { usePresentationSocket } from '@/hooks/usePresentationSocket'
import { useVoteAnimationController } from '@/hooks/useVoteAnimationController'
import { useCameraStore } from '@/stores/useCameraStore'
import colorMap from './colorMap'
import { emit } from '@/stores/events/eventBus'

export default function VoteButtons({ nodes, materials, powerOn }) {
    const { castVote, resetVotes } = usePresentationSocket("room-123")
    const currentCamera = useCameraStore((state) => state.currentCamera)
    const setCamera = useCameraStore((state) => state.setCamera)
    const { refs, pressed, flash, update, triggerFlash } = useVoteAnimationController(materials)

    const flashDuration = 550

    const handleClick = useCallback((color) => {
        if (!powerOn) return

        // Emit vote
        emit({
            type: "VOTE_CAST",
            payload: { color }
        })
        castVote(color)
        //console.log("[VoteButtons] event emitted:", color)  // <-- ADD THIS
        // Trigger animation via hook
        triggerFlash(color, flashDuration)

        update(true)
        // Switch camera after animation
        setTimeout(() => {
            setCamera("metrics")
        }, flashDuration)

    }, [powerOn, castVote, flashDuration, update, triggerFlash, setCamera])

    useFrame(() => {
        update()
    })

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

