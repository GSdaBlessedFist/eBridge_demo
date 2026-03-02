import { useEffect } from "react"
import { io } from "socket.io-client"
import { useVoteStore } from "../stores/useVoteStore"
let socket
let currentRoomId // track current room globally
export const usePresentationSocket = (roomId) => {
    const setVoteState = useVoteStore((state) => state.setVoteState)
    const setConsensus = useVoteStore((state) => state.setConsensus)
    const resetConsensus = useVoteStore((state) => state.resetConsensus)

    useEffect(() => {
        socket = io("http://localhost:3001")
        currentRoomId = roomId
        socket.emit("joinPresentation", roomId)
        socket.on("voteUpdate", (payload) => {
            console.log("Received voteUpdate:", payload)
            setVoteState(payload)
        })
        socket.on("consensusReached", (color) => {
            setConsensus(color)
        })
        socket.on("consensusReset", () => {
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
                socket.emit("resetVotes", { roomId })
                keyBuffer = ""
            }
        }
        return () => {
            window.addEventListener("keydown", handleKeyDown)
            socket.disconnect()
        }


    }, [roomId])

    // -----------------------------
    // Function to emit votes
    // -----------------------------
    const castVote = (color) => {
        if (!socket || !currentRoomId) return
        socket.emit("castVote", { roomId: currentRoomId, color })
    }
    // Return castVote so components can use it
    return { castVote }
}