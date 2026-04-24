import { create } from 'zustand'

export const useVoteStore = create((set) => ({
    votes: {},
    percentages: {},
    totalVoters: 0,
    consensusColor: null,
    userVotes: {},
    voteMode: "STRICT",
    gameMode: false,
    winner: null,

    calculatePercentages: () => {
        const { votes, totalVoters } = get()
        const percentages = {}
        if (totalVoters === 0) {
            set({ percentages: { red: 0, green: 0, blue: 0 } })
            return
        }

        for (const color in votes) {
            percentages[color] = (votes[color] / totalVoters) * 100
        }

        set({ percentages })
    },
    setVoteState: (payload) => {
        console.log("[STORE] setVoteState called with:", payload)

        set((state) => {
            console.log("[STORE] BEFORE:", state)

            const newState = {
                ...state,
                votes: payload.votes,
                percentages: payload.percentages,
                totalVoters: payload.totalVoters
            }

            // newState.percentages = Object.keys(newState.votes).reduce((acc, color) => {
            //     acc[color] = (newState.votes[color] / (newState.totalVoters || 1)) * 100
            //     return acc
            // }, {})
            newState.percentages = {
                red: (newState.votes.red || 0) / (newState.totalVoters || 1) * 100,
                green: (newState.votes.green || 0) / (newState.totalVoters || 1) * 100,
                blue: (newState.votes.blue || 0) / (newState.totalVoters || 1) * 100
            }

            console.log("[STORE] AFTER:", newState)

            return newState
        })
    },

    setConsensus: (color) =>
        set({
            consensusColor: color
        }),

    resetConsensus: () =>
        set({
            consensusColor: null
        }),

    setWinner: (color) =>
        set({
            winner: color
        }),
    resetWinner: () =>
        set({
            winner: null
        }),

    setConfig: ({ voteMode, gameMode }) =>
        set((state) => ({
            // voteMode: voteMode ?? state.voteMode,
            // gameMode: gameMode ?? state.gameMode
            voteMode: "STRICT",
            gameMode: false,
        }))
}))