"use client"

import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"

export const useVoteSocket = (roomId) => {
    const socketRef = useRef(null)

    // ✅ START NULL (no fake initial state)
    const [voteUpdate, setVoteUpdate] = useState(null)

    const [consensus, setConsensus] = useState(null)
    const [consensusReset, setConsensusReset] = useState(false)

    useEffect(() => {
        if (socketRef.current) return

        socketRef.current = io("http://localhost:3001")

        socketRef.current.emit("joinPresentation", roomId)

        // =========================
        // 📊 VOTE UPDATES (snapshot + live)
        // =========================
        socketRef.current.on("voteUpdate", (payload) => {
            setVoteUpdate((prev) => ({
                // ✅ if first payload, just use it
                ...(prev || {}),
                ...payload
            }))
        })

        // =========================
        // 🏁 CONSENSUS
        // =========================
        socketRef.current.on("consensusReached", (color) => {
            console.log("[consensusReached]", color)
            setConsensus(color)
        })

        socketRef.current.on("consensusReset", () => {
            setConsensus(null)
            setConsensusReset(true)
        })

        socketRef.current.on("resetAll", () => {
            setConsensus(null)
            setVoteUpdate({
                votes: { red: 0, green: 0, blue: 0 },
                raceVotes: { red: 0, green: 0, blue: 0 },
                percentages: { red: 0, green: 0, blue: 0 },
                totalVoters: 0,
                voteMode: "ACTIVE_ONLY",
                gameMode: false
            })
        })

        socketRef.current.on("gameWinner", (color) => {
            console.log("[CLIENT] gameWinner:", color)
            setConsensus(color)
        })

        socketRef.current.on("gameReset", () => {
            setConsensus(null)
            setConsensusReset(true)
        })

        return () => {
            socketRef.current.disconnect()
            socketRef.current = null
        }
    }, [roomId])

    // =========================
    // 🔄 RESET FLAG CLEANUP
    // =========================
    useEffect(() => {
        if (!consensusReset) return

        const timeout = setTimeout(() => {
            setConsensusReset(false)
        }, 0)

        return () => clearTimeout(timeout)
    }, [consensusReset])

    // =========================
    // 🎯 ACTIONS
    // =========================
    const castVote = (color) => {
        if (!socketRef.current) return

        socketRef.current.emit("castVote", {
            roomId,
            color
        })
    }

    return {
        castVote,
        voteUpdate,
        consensus,
        consensusReset
    }
}