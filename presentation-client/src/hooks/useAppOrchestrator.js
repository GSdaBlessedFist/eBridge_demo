// 2026-04-01 11:35

import { useEffect } from 'react'
import { useVoteStore } from '@/stores/useVoteStore'
import { useCameraStore } from '@/stores/useCameraStore'
import { usePresentationSocket } from '@/hooks/usePresentationSocket'
import { on } from '@/stores/events/eventBus'

export function useAppOrchestrator() {
    const { castVote } = usePresentationSocket("room-123")

    useEffect(() => {
        const offVote = on((event) => {
            if (event.type === "VOTE_CAST") {
                const { color } = event.payload
                console.log("[Event] vote.cast:", color)

                // 1️⃣ Send vote
                castVote(color)

                // 2️⃣ Switch camera
                setTimeout(() => setCamera("metrics"), 550)
            }

            return () => {
                offVote()
            }
        }, [castVote])
    })
}