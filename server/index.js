// 2026-03-01 23:30
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const rateLimiter = require('./rateLimiter')
const { getRoom,
    registerVote,
    calculatePercentages,
    allSameColor,
    resetVotes,
    removeVoter } = require('./rooms')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: { origin: '*' } // allow all for local dev
})

// ----------------------------
// Socket.io Logic
// ----------------------------
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join a room
    socket.on('joinPresentation', (roomId) => {
        socket.data.roomId = roomId
        socket.join(roomId)
        console.log(`${socket.id} joined room ${roomId}`)


        // Send initial state if room exists
        const room = getRoom(roomId)
        if (room) {
            socket.emit('voteUpdate', {//<-----castVote
                votes: room.votes,
                percentages: calculatePercentages(room),
                totalVoters: room.totalVoters,
                consensusColor: room.consensusColor || null
            })
        }
    })

    socket.on('configChange', ({ roomId = "room-123", voteMode, gameMode }) => {
        const room = getRoom(roomId)
        if (!room) return

        // -----------------------------
        // Update config first
        // -----------------------------
        if (voteMode) room.config.vote = voteMode

        if (gameMode !== undefined) {
            room.config.isGameMode = gameMode
            room.winner = null

            // GameMode always forces ACTIVE_ONLY
            if (gameMode) {
                room.config.vote = "ACTIVE_ONLY"
                io.emit("resetAll")
            }
        }

        console.log(`[Config Updated]`, room.config.vote, room.config.isGameMode)

        // -----------------------------
        // Recompute votes immediately (IMPORTANT FIX)
        // -----------------------------
        let votesToCount = {}

        const mode = room.config.vote

        if (mode === "ACTIVE_ONLY") {
            for (const [id, c] of Object.entries(room.voters)) {
                if (!io.sockets.sockets.get(id)) continue
                votesToCount[c] = (votesToCount[c] || 0) + 1
            }
        } else {
            // PERSISTENT + STRICT fallback = raw stored votes
            votesToCount = { ...room.votes }
        }

        // -----------------------------
        // Emit UPDATED config first
        // -----------------------------
        io.to(roomId).emit('configUpdated', {
            voteMode: room.config.vote,
            gameMode: room.config.isGameMode
        })

        // -----------------------------
        // Emit corrected vote state immediately
        // -----------------------------
        io.to(roomId).emit("voteUpdate", {
            votes: votesToCount,
            raceVotes: room.votes,
            percentages: calculatePercentages(room),
            totalVoters: Object.keys(room.voters).length
        })

        // -----------------------------
        // THEN reset game if needed
        // -----------------------------
        if (gameMode !== undefined) {
            io.to(roomId).emit('gameReset')
        }
    })

    /////////////////////////////////////////////////
    /////////////////////////////////////////////////


    //-------------------------------------------------------
    socket.on('castVote', ({ roomId, color }) => {
        // -----------------------------
        // 1. Get room
        // -----------------------------
        console.log('[Server] castVote received:', { roomId, color })
        const room = getRoom(roomId)
        if (!room) return

        // -----------------------------
        // 2. Stop voting if game already won
        // -----------------------------
        console.log("[DEBUG] before winner check", room.winner)
        if (room.config.isGameMode && room.winner) {
            console.log("[DEBUG] EXITING due to winner")
            return
        }
        console.log("[DEBUG] passed winner check")

        // -----------------------------
        // 3. Register the vote
        // -----------------------------
        console.log("[DEBUG] registering vote")
        registerVote(roomId, socket.id, color)
        console.log("[DEBUG] after registerVote")
        console.log("ROOM STATE:", {
            votes: room.votes,
            voters: room.voters,
            totalVoters: Object.keys(room.voters).length
        })

        // -----------------------------
        // 4. Read config
        // -----------------------------
        const { vote: voteMode = "ACTIVE_ONLY", isGameMode = false } = room.config
        console.log("[CAST VOTE] Current Config:", voteMode, isGameMode);
        // // -----------------------------
        // // 5. Apply logic based on mode

        console.log("isGameMode:", isGameMode)


        let votesToCount = { ...room.votes } //04/15


        if (voteMode === "ACTIVE_ONLY") {
            votesToCount = {}

            for (const [id, c] of Object.entries(room.voters)) {
                if (!io.sockets.sockets.get(id)) continue
                votesToCount[c] = (votesToCount[c] || 0) + 1
            }
        }
        // PERSISTENT = no change

        // -----------------------------
        // B. Apply GAME MODE (Race)
        // -----------------------------
        if (isGameMode) {
            const THRESHOLD = 2

            for (const [color, count] of Object.entries(votesToCount)) {
                if (count >= THRESHOLD) {
                    room.winner = color
                    io.to(roomId).emit("gameWinner", color)
                    console.log("[GAME MODE] Winner reached:", color)
                    break
                }
            }
            console.log("ROOM STATE:", {
                votes: room.votes,
                voters: room.voters,
                totalVoters: Object.keys(room.voters).length
            })
        } else {
            // -----------------------------
            // C. ACTIVE_ONLY consensus logic
            // -----------------------------
            const uniqueColors = Object.keys(votesToCount)
            const totalVotes = Object.values(votesToCount).reduce((a, b) => a + b, 0)

            if (
                voteMode === "ACTIVE_ONLY" &&
                uniqueColors.length === 1 &&
                totalVotes === Object.keys(room.voters).length &&
                totalVotes > 1
            ) {
                const winner = uniqueColors[0]
                console.log("[ACTIVE_ONLY] Consensus detected:", winner)
                io.to(roomId).emit("consensusReached", winner)
            }
        }

        // -----------------------------
        // 6. Always send vote update
        // -----------------------------


        console.log("[Server] Emitting voteUpdate:", room.votes)
        io.to(roomId).emit("voteUpdate", {
            votes: votesToCount,
            raceVotes: room.votes,
            percentages: calculatePercentages(room),
            totalVoters: Object.keys(room.voters).length,
            voteMode: room.config.vote,   // 👈 ADD THIS
            gameMode: room.config.isGameMode // 👈 OPTIONAL BUT USEFUL
        })
    })
    //--------------------------------------------------------


    /////////////////////////////////////////////////
    /////////////////////////////////////////////////

    // 2026-03-02 00:30
    socket.on('disconnect', () => {
        const roomId = socket.data.roomId

        if (!roomId) return

        console.log('Disconnect cleanup for room:', roomId)


        const room = getRoom(roomId)
        if (!room) return

        console.log('[BEFORE REMOVE]', room.voters)

        //removeVoter(roomId, socket.id)
        const voteMode = room.config.vote

        if (voteMode === "ACTIVE_ONLY") {
            removeVoter(roomId, socket.id)
        }


        console.log("[AFTER REMOVE] ROOM STATE:", {
            votes: room.votes,
            voters: room.voters,
            totalVoters: Object.keys(room.voters).length
        })

        io.to(roomId).emit('voteUpdate', {
            votes: room.votes,
            percentages: calculatePercentages(room),
            totalVoters: Object.keys(room.voters).length
        })

        const consensusColor = allSameColor(room)
        if (consensusColor) {
            io.to(roomId).emit('consensusReached', consensusColor)
        } else {
            io.to(roomId).emit('consensusReset')
        }

    })

    // 2026-03-02 00:18
    socket.on('resetVotes', ({ roomId = "room-123" }) => {
        const room = resetVotes(roomId)

        io.to(roomId).emit('voteUpdate', {
            votes: room.votes,
            percentages: calculatePercentages(room),
            totalVoters: Object.keys(room.voters).length
        })
        console.log("ROOM STATE:", {
            votes: room.votes,
            voters: room.voters,
            totalVoters: Object.keys(room.voters).length
        })

        io.to(roomId).emit('resetAll')
    })

    socket.on('resetGame', ({ roomId = "room-123" }) => {
        const room = getRoom(roomId)
        if (!room) return

        room.winner = null

        io.to(roomId).emit('gameReset')
    })
    socket.on("resetAll", ({ roomId = "room-123" }) => {
        const room = getRoom(roomId)
        if (!room) return

        console.log("[Server] resetAll triggered")

        // Clear everything
        room.votes = {}
        room.voters = {}
        room.winner = null

        io.to(roomId).emit("resetAll")
    })
})

// ----------------------------
// Start Server
// ----------------------------
server.listen(3001, () => {
    console.log('Server running on port 3001')
})