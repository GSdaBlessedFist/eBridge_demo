import { useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { useVoteStore } from "../stores/useVoteStore"


export const usePresentationSocket = (roomId) => {
    const socketRef = useRef(null)

    const setVoteState = useVoteStore((state) => state.setVoteState)
    const setConsensus = useVoteStore((state) => state.setConsensus)
    const resetConsensus = useVoteStore((state) => state.resetConsensus)
    const setConfig = useVoteStore((state) => state.setConfig)

    useEffect(() => {
        socketRef.current = io("http://localhost:3001")

        socketRef.current.emit("joinPresentation", roomId)

        //console.log("[Socket] Registering voteUpdate listener")
        socketRef.current.on("voteUpdate", (payload) => {
            //console.log("🔥 voteUpdate ACTUALLY RECEIVED:", payload)
            setVoteState({
                ...payload,
                votes: { ...payload.votes },
                percentages: { ...payload.percentages }
            })
        })

        socketRef.current.on("consensusReached", (color) => {
            //console.log("[Socket] consensusReached:", color)
            setConsensus(color)
        })

        socketRef.current.on("consensusReset", () => {
            //console.log("[Socket] consensusReset")
            resetConsensus()
        })

        socketRef.current.on("configUpdated", (config) => {
            console.log("[Socket] configUpdated:", config)
            setConfig(config)
        })

        // 2026-03-02 00:45
        let keyBuffer = ""

        const handleKeyDown = (event) => {
            keyBuffer += event.key.toLowerCase()

            // keep only last 5 characters
            if (keyBuffer.length > 5) {
                keyBuffer = keyBuffer.slice(-5)
            }

            if (keyBuffer === "reset") {
                console.log("Reset sequence detected")
                socketRef.current.emit("resetVotes", { roomId })
                keyBuffer = ""
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            socketRef.current.disconnect()
        }


    }, [roomId])

    // -----------------------------
    // Function to emit votes
    // -----------------------------
    const castVote = (color) => {
        if (!socketRef.current) {
            console.warn("[Socket] No socket available to cast vote")
            return
        }
        console.log(`[Socket] Emitting vote: color=${color}, roomId=${roomId}`)
        socketRef.current.emit("castVote", { roomId, color })
    }

    const resetVotes = (roomId) => {
        if (!socketRef.current) return
        socketRef.current.emit("resetVotes", { roomId })
    }
    const updateConfig = ({ currentConfigMode, gameMode }) => {
        if (!socketRef.current) return
        socketRef.current.emit("configChange", {
            roomId: "room-123",
            voteMode: currentConfigMode,
            gameMode
        })
        // console.log("[Socket 92] Emitted configChange:", currentConfigMode)
        // console.log("[Socket 93] Emitted configChange:", gameMode)
    }
    // Return castVote so components can use it
    return { castVote, resetVotes, updateConfig }
}

