// rateLimiter.js

const voteTimestamps = new Map()
const VOTE_INTERVAL_MS = 1000

function canVote(socketId) {
    const now = Date.now()
    const lastVote = voteTimestamps.get(socketId)

    if (lastVote && now - lastVote < VOTE_INTERVAL_MS) {
        return false
    }

    voteTimestamps.set(socketId, now)
    return true
}

function clearSocket(socketId) {
    voteTimestamps.delete(socketId)
}

module.exports = {
    canVote,
    clearSocket
}