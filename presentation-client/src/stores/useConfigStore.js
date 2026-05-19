import { create } from "zustand";
import { on } from "./events/eventBus";
import { useVoteStore } from "./useVoteStore";

const modes = ['ACTIVE_ONLY', 'PERSISTENT']

export const useConfigStore = create((set) => ({
    currentConfigMode: "ACTIVE_ONLY",
    setConfigMode: (configMode) => {
        set({
            currentConfigMode: configMode
        })
    },
    isGameMode: false,
    setIsGameMode: (gameMode) => {
        set({
            isGameMode: gameMode
        })
    }
}))

on((event) => {
    if (event.type === 'CONFIG_MODE_CYCLE') {
        useConfigStore.setState((state) => {
            const currentIndex = modes.indexOf(state.currentConfigMode)
            const safeIndex = currentIndex === -1 ? 0 : currentIndex
            const nextIndex = (safeIndex + 1) % modes.length
            console.log("currentConfigMode:", modes[nextIndex])
            return {
                currentConfigMode: modes[nextIndex]
            }
        })
    }
    if (event.type === "CONFIG_GAME_MODE") {
        useConfigStore.setState((state) => {
            console.log('GameMode toggled:', !state.isGameMode)
            return {
                currentConfigMode: (state.isGameMode ? "ACTIVE_ONLY" : state.currentConfigMode),
                isGameMode: !state.isGameMode
            }
        })
        console.log('Winner (BEFORE):', useVoteStore.getState().winner)
        useVoteStore.getState().resetWinner()
        console.log('Winner (AFTER):', useVoteStore.getState().winner)
    }

    if (event.type === "POWER_OFF") {
        console.log("🔌 POWER_OFF → resetting game mode")

        useConfigStore.setState({
            currentConfigMode: "ACTIVE_ONLY",
            isGameMode: false
        })
    }
})