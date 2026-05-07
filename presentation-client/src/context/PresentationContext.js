// 2026-05-05 00:00
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

    // =========================
    // 🧠 SOCKET INIT (SINGLE SOURCE OF TRUTH)
    // =========================
    useEffect(() => {
        if (socketRef.current) return

        console.log("[Provider] creating socket")

        const socket = io("http://localhost:3001")
        socketRef.current = socket

        socket.emit("joinPresentation", roomId)

        // =========================
        // 📊 VOTES
        // =========================
        socket.on("voteUpdate", (payload) => {
            setVoteState(payload)
        })

        // =========================
        // 🏁 CONSENSUS
        // =========================
        socket.on("consensusReached", (color) => {
            setConsensus(color)
        })

        socket.on("consensusReset", () => {
            resetConsensus()
        })

        // =========================
        // ⚙️ CONFIG SYNC
        // =========================
        socket.on("configUpdated", (config) => {
            console.log("[Provider] configUpdated:", config)
            setConfig(config)
        })

        // =========================
        // 🏆 GAME WINNER (MOVED FROM HOOK ❗)
        // =========================
        socket.on("gameWinner", (color) => {
            console.log("[Provider] gameWinner:", color)
            useVoteStore.setState({ winner: color })
        })

        // =========================
        // 🔄 FULL RESET (MOVED FROM HOOK ❗)
        // =========================
        socket.on("resetAll", () => {
            console.log("[Provider] resetAll received")

            resetConsensus()
            useVoteStore.setState({
                winner: null,
                votes: {},
                percentages: {},
                totalVoters: 0
            })
        })

        // =========================
        // 🔑 RESET KEY DETECTION
        // =========================
        let keyBuffer = ""

        const handleKeyDown = (event) => {
            keyBuffer += event.key.toLowerCase()

            if (keyBuffer.length > 5) {
                keyBuffer = keyBuffer.slice(-5)
            }

            if (keyBuffer === "reset") {
                console.log("Reset sequence detected")

                socketRef.current?.emit("resetAll", { roomId })

                keyBuffer = ""
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => {
            console.log("[Provider] cleanup socket")

            window.removeEventListener("keydown", handleKeyDown)

            socket.off("voteUpdate")
            socket.off("consensusReached")
            socket.off("consensusReset")
            socket.off("configUpdated")
            socket.off("gameWinner")
            socket.off("resetAll")

            socket.disconnect()
            socketRef.current = null
        }
    }, [roomId])



    // =========================
    // 🎯 EMIT FUNCTIONS (ONLY HERE NOW)
    // =========================

    const castVote = (color) => {
        socketRef.current?.emit("castVote", { roomId, color })
    }

    const resetVotes = () => {
        socketRef.current?.emit("resetVotes", { roomId })
    }

    // 🔥 REPLACEMENT FOR ALL OLD CONFIG EMITS
    const emitUpdateConfig = (config) => {
        socketRef.current?.emit("configChange", {
            roomId,
            voteMode: config.currentConfigMode ?? config.voteMode,
            gameMode: config.gameMode ?? config.isGameMode
        });
    };

    const resetAll = () => {
        socketRef.current?.emit("resetAll", { roomId })
    }

    return (
        <PresentationContext.Provider
            value={{
                castVote,
                resetVotes,
                emitUpdateConfig, // ✅ unified config function
                resetAll          // ✅ added explicit full reset
            }}
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