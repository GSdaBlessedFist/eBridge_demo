// 2026-04-16 14:40
"use client"

import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"

export const useVoteSocket = (roomId) => {
    const socketRef = useRef(null)
    const [voteUpdate, setVoteUpdate] = useState(null)
    const [consensus, setConsensus] = useState(null)

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

        return () => {
            socketRef.current.disconnect()
            socketRef.current = null
        }
    }, [roomId])

    const castVote = (color) => {
        if (!socketRef.current) return

        socketRef.current.emit("castVote", {
            roomId,
            color
        })
    }

    return { castVote, voteUpdate, consensus }
}