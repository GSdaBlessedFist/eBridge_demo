import { create } from 'zustand'

export const useVoteStore = create((set) => ({
    votes: {},
    percentages: {},
    totalVoters: 0,
    consensusColor: null,
    userVotes: {},

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

    setConfig: ({ voteMode, gameMode }) =>
        set((state) => ({
            voteMode: voteMode ?? state.voteMode,
            gameMode: gameMode ?? state.gameMode
        }))
}))