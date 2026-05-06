// import { useEffect, useRef } from "react"
// import { io } from "socket.io-client"
// import { useVoteStore } from "../stores/useVoteStore"
// import { on } from "@/stores/events/eventBus"
// import { usePresentation } from "@/context/PresentationContext"


// export const usePresentationSocket = (roomId) => {
//     const socketRef = useRef(null)

//     const setVoteState = useVoteStore((state) => state.setVoteState)
//     const setConsensus = useVoteStore((state) => state.setConsensus)
//     const resetConsensus = useVoteStore((state) => state.resetConsensus)
//     const setConfig = useVoteStore((state) => state.setConfig)
//     const [emitUpdateConfig] = usePresentation();

//     useEffect(() => {
//         if (socketRef.current) {
//             console.log("line 17 [Socket] already exists, skipping creation")
//             return
//         }

//         console.log("[Socket] creating connection")

//         socketRef.current = io("http://localhost:3001")

//         socketRef.current.emit("joinPresentation", roomId)

//         //console.log("[Socket] Registering voteUpdate listener")
//         socketRef.current.on("voteUpdate", (payload) => {
//             //console.log("🔥 voteUpdate ACTUALLY RECEIVED:", payload)
//             setVoteState({
//                 ...payload,
//                 votes: { ...payload.votes },
//                 percentages: { ...payload.percentages }
//             })
//         })

//         socketRef.current.on("consensusReached", (color) => {
//             //console.log("[Socket] consensusReached:", color)
//             setConsensus(color)
//         })

//         socketRef.current.on("gameWinner", (color) => {
//             console.log("[Socket] gameWinner:", color)
//             useVoteStore.setState({ winner: color })
//         })

//         socketRef.current.on("consensusReset", () => {
//             //console.log("[Socket] consensusReset")
//             resetConsensus()
//         })

//         socketRef.current.on("configUpdated", (config) => {
//             console.log("[Socket] configUpdated:", config)
//             setConfig(config)
//         })

//         socketRef.current.on("resetAll", () => {
//             resetConsensus()
//             useVoteStore.setState({
//                 winner: null,
//                 votes: {},
//                 percentages: {},
//                 totalVoters: 0
//             })
//         })

//         return () => {

//             socketRef.current.disconnect()
//             socketRef.current = null
//         }


//     }, [])

//     useEffect(() => {
//         let keyBuffer = ""

//         const handleKeyDown = (event) => {
//             keyBuffer += event.key.toLowerCase()

//             // keep only last 5 characters
//             if (keyBuffer.length > 5) {
//                 keyBuffer = keyBuffer.slice(-5)
//             }

//             if (keyBuffer === "reset") {
//                 console.log("Reset sequence detected")
//                 socketRef.current.emit("resetAll", { roomId })
//                 keyBuffer = ""
//             }
//         }
//         window.addEventListener("keydown", handleKeyDown)

//         return () => {
//             window.removeEventListener("keydown", handleKeyDown)
//         }
//     }, [])

//     // 2026-04-29 19:10
//     useEffect(() => {
//         const off = on((event) => {
//             if (!socketRef.current) return

//             // 🔴 FULL RESET
//             if (event.type === "POWER_OFF") {
//                 console.log("[Socket] POWER_OFF received")

//                 // socketRef.current.emit("configChange", {
//                 //     roomId,
//                 //     voteMode: "ACTIVE_ONLY",
//                 //     gameMode: false
//                 // })
//                 //emitUpdateConfig

//                 // if (event.payload?.isAdmin) {
//                 //     socketRef.current.emit("resetGame", { roomId })
//                 // }

//                 socketRef.current.emit("resetVotes", { roomId })
//             }

//             // 🟡 RETURN (no server reset)
//             if (event.type === "RETURN") {
//                 console.log("[Socket] RETURN received (no-op)")
//                 // intentionally do nothing
//             }
//         })

//         return off
//     }, [roomId])

//     // -----------------------------
//     // Function to emit votes
//     // -----------------------------
//     const castVote = (color) => {
//         if (!socketRef.current) {
//             console.warn("[Socket] No socket available to cast vote")
//             return
//         }
//         console.log(`[Socket] Emitting vote: color=${color}, roomId=${roomId}`)
//         socketRef.current.emit("castVote", { roomId, color })
//     }

//     const resetVotes = (roomId) => {
//         if (!socketRef.current) return
//         socketRef.current.emit("resetVotes", { roomId })
//     }
//     const updateConfig = ({ currentConfigMode, gameMode }) => {
//         if (!socketRef.current) return
//         socketRef.current.emit("configChange", {
//             roomId: "room-123",
//             voteMode: currentConfigMode,
//             gameMode
//         })
//         // console.log("[Socket 92] Emitted configChange:", currentConfigMode)
//         // console.log("[Socket 93] Emitted configChange:", gameMode)
//     }
//     // Return castVote so components can use it
//     return { castVote, resetVotes, updateConfig }
// }

// 2026-05-05 00:00
// ⚠️ DEPRECATED: socket logic moved to PresentationProvider

export const usePresentationSocket = () => {
    console.warn("[usePresentationSocket] deprecated — use usePresentation() instead")

    return {
        castVote: () => {
            console.warn("Use PresentationContext.castVote instead")
        },
        resetVotes: () => {
            console.warn("Use PresentationContext.resetVotes instead")
        },
        updateConfig: () => {
            console.warn("Use PresentationContext.emitUpdateConfig instead")
        }
    }
}