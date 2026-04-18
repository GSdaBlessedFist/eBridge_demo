// 2026-04-16 14:40
"use client"

import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"

export const useVoteSocket = (roomId) => {
    const socketRef = useRef(null)
    const [voteUpdate, setVoteUpdate] = useState(null)
    const [consensus, setConsensus] = useState(null)
    const [consensusReset, setConsensusReset] = useState(false)

    useEffect(() => {
        if (socketRef.current) return

        socketRef.current = io("http://localhost:3001")

        socketRef.current.emit("joinPresentation", roomId)

        socketRef.current.on("voteUpdate", (payload) => {
            setVoteUpdate(payload)
        })
        socketRef.current.on("consensusReached", (color) => {
            setConsensus(color)
        })

        socketRef.current.on("consensusReset", () => {
            setConsensus(null)        // clear winner
            setConsensusReset(true)   // trigger UI reset
        })

        return () => {
            socketRef.current.disconnect()
            socketRef.current = null
        }
    }, [roomId])

    useEffect(() => {
        if (!consensusReset) return

        const timeout = setTimeout(() => {
            setConsensusReset(false)
        }, 0)

        return () => clearTimeout(timeout)
    }, [consensusReset])

    const castVote = (color) => {
        if (!socketRef.current) return

        socketRef.current.emit("castVote", {
            roomId,
            color
        })
    }

    return { castVote, voteUpdate, consensus, consensusReset }
}