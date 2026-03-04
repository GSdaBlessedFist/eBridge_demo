import { useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { useVoteStore } from "../stores/useVoteStore"


export const usePresentationSocket = (roomId) => {
    const socketRef = useRef(null)

    const setVoteState = useVoteStore((state) => state.setVoteState)
    const setConsensus = useVoteStore((state) => state.setConsensus)
    const resetConsensus = useVoteStore((state) => state.resetConsensus)

    useEffect(() => {
        socketRef.current = io("http://localhost:3001")

        socketRef.current.emit("joinPresentation", roomId)

        socketRef.current.on("voteUpdate", (payload) => {
            setVoteState(payload)
        })

        socketRef.current.on("consensusReached", (color) => {
            setConsensus(color)
        })

        socketRef.current.on("consensusReset", () => {
            resetConsensus()
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
        if (!socketRef.current) return
        socketRef.current.emit("castVote", { roomId, color })
    }
    // Return castVote so components can use it
    return { castVote }
}