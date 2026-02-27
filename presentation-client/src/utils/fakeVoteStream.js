// 2026-02-24 11:26

import { useVoteStore } from "@/stores/useVoteStore"


const colors = ['red', 'green', 'blue']

export function startFakeVoteStream(interval = 1000) {

    return setInterval(() => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)]
        useVoteStore.getState().incrementVote(randomColor)
        console.log(
            'Vote incremented:',
            randomColor,
            'Percentage:',
            `${(useVoteStore.getState().getPercentages()[randomColor] * 100).toFixed(2)}%`
        );
    }, interval)
}