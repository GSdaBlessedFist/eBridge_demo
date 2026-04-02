import { create } from 'zustand'

export const useVoteStore = create((set) => ({
    votes: {},
    percentages: {},
    totalVoters: 0,
    consensusColor: null,
    userVotes: {},

    setVoteState: ({ votes, percentages, totalVoters }) =>
        set({
            votes,
            percentages,
            totalVoters
        }),

    setConsensus: (color) =>
        set({
            consensusColor: color
        }),

    resetConsensus: () =>
        set({
            consensusColor: null
        })
}))