// 2026-03-01 23:55
"use client"

import { createContext, useContext, useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { useVoteStore } from "../stores/useVoteStore"

const PresentationContext = createContext(null)

export const PresentationProvider = ({ children, roomId }) => {
    const socketRef = useRef(null)

    const setVoteState = useVoteStore((state) => state.setVoteState)
    const setConsensus = useVoteStore((state) => state.setConsensus)
    const resetConsensus = useVoteStore((state) => state.resetConsensus)
    const setConfig = useVoteStore((state) => state.setConfig)

    useEffect(() => {
        if (socketRef.current) return

        console.log("[Provider] creating socket")

        const socket = io("http://localhost:3001")
        socketRef.current = socket

        socket.emit("joinPresentation", roomId)

        socket.on("voteUpdate", (payload) => {
            setVoteState(payload)
        })

        socket.on("consensusReached", (color) => {
            setConsensus(color)
        })

        socket.on("consensusReset", () => {
            resetConsensus()
        })

        socket.on("configUpdated", (config) => {
            setConfig(config)
        })

        return () => {
            console.log("[Provider] cleanup socket")

            socket.off("voteUpdate")
            socket.off("consensusReached")
            socket.off("consensusReset")
            socket.off("configUpdated")

            socket.disconnect()
            socketRef.current = null
        }
    }, [roomId])

    const castVote = (color) => {
        socketRef.current?.emit("castVote", { roomId, color })
    }

    const resetVotes = () => {
        socketRef.current?.emit("resetVotes", { roomId })
    }

    const updateConfig = (config) => {
        socketRef.current?.emit("configChange", {
            roomId,
            ...config
        })
    }

    return (
        <PresentationContext.Provider
            value={{ castVote, resetVotes, updateConfig }}
        >
            {children}
        </PresentationContext.Provider>
    )
}

export const usePresentation = () => {
    const context = useContext(PresentationContext)
    if (!context) {
        throw new Error("usePresentation must be used within PresentationProvider")
    }
    return context
}