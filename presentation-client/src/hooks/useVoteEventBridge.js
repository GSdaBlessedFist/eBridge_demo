// 2026-04-01 12:30
import { useEffect } from "react"
import { useVoteStore } from "../stores/useVoteStore"
import { on } from "@/stores/events/eventBus"

export function useVoteEventBridge() {
    useEffect(() => {
        const unsubscribe = on((event) => {
            if (event.type !== "VOTE_CAST") return

            const { color } = event.payload
            console.log("[VoteEventBridge] Processing vote:", color)

            // const state = useVoteStore.getState()

            // const votes = { ...state.votes }
            // votes[color] = (votes[color] || 0) + 1

            // const total = Object.values(votes).reduce((a, b) => a + b, 0)

            // const percentages = {}
            // Object.keys(votes).forEach((key) => {
            //     percentages[key] = (votes[key] / total) * 100
            // })

            // let consensusColor = null
            // let max = -1
            // Object.entries(votes).forEach(([key, val]) => {
            //     if (val > max) {
            //         max = val
            //         consensusColor = key
            //     }
            // })

            // useVoteStore.setState({
            //     userVotes,
            //     votes,
            //     percentages,
            //     totalVoters: total,
            //     consensusColor
            // })

            // 2026-04-01 12:40
            const state = useVoteStore.getState()

            // 👇 simple local user id
            const userId = "local-user"

            // ✅ make sure this exists BEFORE using it later
            const userVotes = { ...(state.userVotes || {}) }

            // update this user's vote
            userVotes[userId] = color

            // rebuild aggregated votes
            const votes = {}
            Object.values(userVotes).forEach((c) => {
                votes[c] = (votes[c] || 0) + 1
            })

            const total = Object.values(votes).reduce((a, b) => a + b, 0)

            // percentages
            const percentages = {}
            Object.keys(votes).forEach((key) => {
                percentages[key] = (votes[key] / total) * 100
            })

            // consensus
            let consensusColor = null
            let max = -1
            Object.entries(votes).forEach(([key, val]) => {
                if (val > max) {
                    max = val
                    consensusColor = key
                }
            })

            // ✅ now userVotes is defined here
            useVoteStore.setState({
                userVotes,
                votes,
                percentages,
                totalVoters: total,
                consensusColor
            })
        })

        return () => unsubscribe()
    }, [])
}