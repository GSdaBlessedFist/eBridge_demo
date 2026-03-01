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

        return () => {
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