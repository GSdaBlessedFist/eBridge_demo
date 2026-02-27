// 2026-02-24 11:18
import { create } from 'zustand'

export const useVoteStore = create((set, get) => ({
    votes: {
        red: 1,
        green: 1,
        blue: 2,
    },
    setVotes: (newVotes) => {
        set({ votes: newVotes })
    },
    incrementVote: (color) => {
        const current = get().votes
        set({
            votes: {
                ...current,
                [color]: current[color] + 1,
            },
        })
    },
    getPercentages: () => {
        const { red, green, blue } = get().votes
        const total = red + green + blue
        if (total === 0) {
            return { red: 0, green: 0, blue: 0 }
        }
        return {
            red: red / total,
            green: green / total,
            blue: blue / total,
        }
    },
    allSameColor: () => {
        const percentages = get().getPercentages()
        return Object.values(percentages).some((p) => p === 1)
    }
}))