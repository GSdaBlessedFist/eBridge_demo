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

    // Handle vote cast
    socket.on('castVote', ({ roomId, color }) => {
        // Rate limiting
        if (!rateLimiter.canVote(socket.id)) return

        const room = getRoom(roomId)
        if (!room) return

        // Register the vote
        registerVote(roomId, socket.id, color)

        // Broadcast updated vote state
        io.to(roomId).emit('voteUpdate', {
            votes: room.votes,
            percentages: calculatePercentages(room),
            totalVoters: room.totalVoters
        })

        // Check consensus
        const consensusColor = allSameColor(room)
        if (consensusColor) {
            io.to(roomId).emit('consensusReached', consensusColor)
        } else {
            io.to(roomId).emit('consensusReset')
        }
    })

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