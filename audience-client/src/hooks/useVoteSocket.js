// 2026-04-16 14:40
"use client"

import { useEffect, useRef } from "react"
import { io } from "socket.io-client"

export const useVoteSocket = (roomId) => {
    const socketRef = useRef(null)

    useEffect(() => {
        if (socketRef.current) return

        socketRef.current = io("http://localhost:3001")

        socketRef.current.emit("joinPresentation", roomId)

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

    return { castVote }
}