// 2026-03-01 23:30
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const rateLimiter = require('./rateLimiter')
const { getRoom } = require('./rooms')

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
            socket.emit('voteUpdate', {
                votes: room.votes,
                percentages: room.getPercentages(),
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
        room.registerVote(socket.id, color)

        // Broadcast updated vote state
        io.to(roomId).emit('voteUpdate', {
            votes: room.votes,
            percentages: room.getPercentages(),
            totalVoters: room.totalVoters
        })

        // Check consensus
        const consensusColor = room.allSameColor()
        if (consensusColor) {
            io.to(roomId).emit('consensusReached', consensusColor)
        } else {
            io.to(roomId).emit('consensusReset')
        }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
        // Optionally remove voter from all rooms
        // rooms.forEach(r => r.removeVoter(socket.id))
    })
})

// ----------------------------
// Start Server
// ----------------------------
server.listen(3001, () => {
    console.log('Server running on port 3001')
})