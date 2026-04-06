// rooms.js

const rooms = new Map()

function createRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            votes: {},
            voters: {},
            config: {
                vote: "STRICT",
                isGameMode: false
            },
            winner: null
        })
    }
    return rooms.get(roomId)
}

function getRoom(roomId) {
    if (!rooms.has(roomId)) {
        return createRoom(roomId)
    }
    return rooms.get(roomId)
}

function removeVoter(roomId, socketId) {
    const room = rooms.get(roomId)
    if (!room) return

    const previousVote = room.voters[socketId]
    if (previousVote) {
        room.votes[previousVote]--
    }

    delete room.voters[socketId]
}

function registerVote(roomId, socketId, color) {
    const room = createRoom(roomId)

    if (!room.votes[color]) {
        room.votes[color] = 0
    }

    const previousVote = room.voters[socketId]

    if (previousVote === color) {
        return room
    }

    if (previousVote) {
        room.votes[previousVote]--
    }

    room.votes[color]++
    room.voters[socketId] = color

    return room
}

function calculatePercentages(room) {
    const total = Object.keys(room.voters).length
    const percentages = {}

    if (total === 0) return percentages

    for (const color in room.votes) {
        percentages[color] = (room.votes[color] / total) * 100
    }

    return percentages
}

// 2026-03-01 23:55
function allSameColor(room) {
    const voters = Object.values(room.voters)
    if (voters.length === 0) return null

    const firstColor = voters[0]
    for (const color of voters) {
        if (color !== firstColor) return null
    }
    return firstColor
}

function resetVotes(roomId) {
    const room = getRoom(roomId)
    room.votes = {}
    room.voters = {}
    return room
}

module.exports = {
    createRoom,
    getRoom,
    registerVote,
    removeVoter,
    calculatePercentages,
    allSameColor,
    resetVotes
}