// 2026-03-01 23:30
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const rateLimiter = require('./rateLimiter')
const { getRoom,
    registerVote,
    calculatePercentages,
    allSameColor,
    resetVotes } = require('./rooms')

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
        socket.join(roomId)
        console.log(`${socket.id} joined room ${roomId}`)

        // Send initial state if room exists
        const room = getRoom(roomId)
        if (room) {
            socket.emit('castVote', {
                votes: room.votes,
                percentages: calculatePercentages(room),
                totalVoters: room.totalVoters,
                consensusColor: room.consensusColor || null
            })
        }
    })

    //Configuration Change
    socket.on('configChange', ({ roomId, voteMode, gameMode }) => {
        const room = getRoom(roomId)
        console.log("ROOM CONFIG TEST:", room.config);
        if (!room) return

        if (voteMode) room.config.vote = voteMode
        if (gameMode !== undefined) room.config.isGameMode = gameMode

        console.log(`[Config Updated]`, room.config.vote, room.config.isGameMode)


        io.to(roomId).emit('configUpdated', { ...room.config })
    })

    /////////////////////////////////////////////////
    /////////////////////////////////////////////////

    // Handle vote cast
    // socket.on('castVote', ({ roomId, color }) => {
    //     // Rate limiting
    //     if (!rateLimiter.canVote(socket.id)) return

    //     const room = getRoom(roomId)
    //     if (!room) return

    //     // Register the vote
    //     registerVote(roomId, socket.id, color)

    //     // Broadcast updated vote state
    //     io.to(roomId).emit('voteUpdate', {
    //         votes: room.votes,
    //         percentages: calculatePercentages(room),
    //         totalVoters: room.totalVoters
    //     })

    //     // Check consensus
    //     const consensusColor = allSameColor(room)
    //     if (consensusColor) {
    //         io.to(roomId).emit('consensusReached', consensusColor)
    //     } else {
    //         io.to(roomId).emit('consensusReset')
    //     }
    // })

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
        if (room.winner) return

        // -----------------------------
        // 3. Register the vote
        // -----------------------------
        registerVote(roomId, socket.id, color)

        console.log("ROOM STATE:", {
            votes: room.votes,
            voters: room.voters,
            totalVoters: Object.keys(room.voters).length
        })

        // -----------------------------
        // 4. Read config
        // -----------------------------
        const { vote: voteMode = "STRICT", isGameMode = false } = room.config
        console.log("[CAST VOTE] Current Config:", voteMode, isGameMode);
        // -----------------------------
        // 5. Apply logic based on mode
        // -----------------------------
        if (isGameMode) {
            // Example: first to 3 votes wins (adjust as needed)
            if (room.votes[color] >= 3) {
                room.winner = color
                io.to(roomId).emit("consensusReached", color)
            }
        } else {
            // Config modes: STRICT / PERSISTENT / ACTIVE_ONLY
            let votesToCount = { ...room.votes }

            if (voteMode === "STRICT") {
                // Only count votes of connected participants
                votesToCount = {}
                for (const [id, c] of Object.entries(room.voters)) {
                    if (io.sockets.sockets.get(id)) votesToCount[c] = (votesToCount[c] || 0) + 1
                }
            } else if (voteMode === "ACTIVE_ONLY") {
                // Count votes of connected participants but do NOT remove disconnected votes
                for (const [id, c] of Object.entries(room.voters)) {
                    if (!io.sockets.sockets.get(id)) continue
                    votesToCount[c] = (votesToCount[c] || 0) + 1
                }
            }
            // PERSISTENT counts all votes by default, no change needed

            // -----------------------------
            // Check for consensus in config mode
            // -----------------------------
            const uniqueColors = Object.keys(votesToCount)
            const totalVotes = Object.values(votesToCount).reduce((a, b) => a + b, 0)

            if (voteMode === "STRICT" && uniqueColors.length === 1 && totalVotes > 0) {
                const winner = uniqueColors[0]
                room.winner = winner
                io.to(roomId).emit("consensusReached", winner)
            }
        }



        // -----------------------------
        // 6. Always send vote update
        // -----------------------------
        io.to(roomId).emit("voteUpdate", {
            votes: room.votes,
            percentages: calculatePercentages(room),
            totalVoters: Object.keys(room.voters).length
        })
    })

    /////////////////////////////////////////////////
    /////////////////////////////////////////////////

    // 2026-03-02 00:30
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)

        // socket.rooms includes:
        // - the socket's own ID
        // - any joined rooms
        for (const roomId of socket.rooms) {
            if (roomId === socket.id) continue

            const room = getRoom(roomId)

            removeVoter(roomId, socket.id)

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
        }
    })

    // 2026-03-02 00:18
    socket.on('resetVotes', ({ roomId }) => {
        const room = resetVotes(roomId)

        io.to(roomId).emit('voteUpdate', {
            votes: room.votes,
            percentages: calculatePercentages(room),
            totalVoters: Object.keys(room.voters).length
        })

        io.to(roomId).emit('consensusReset')
    })
})

// ----------------------------
// Start Server
// ----------------------------
server.listen(3001, () => {
    console.log('Server running on port 3001')
})