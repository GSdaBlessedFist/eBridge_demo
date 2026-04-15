import { create } from "zustand";
import { on } from "./events/eventBus";

const modes = ['STRICT', 'PERSISTENT', 'ACTIVE']

export const useConfigStore = create((set) => ({
    currentConfigMode: "STRICT",
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
})

on((event) => {
    if (event.type === "CONFIG_GAME_MODE") {
        useConfigStore.setState((state) => {
            console.log('GameMode toggled:', !state.isGameMode)
            return {
                isGameMode: !state.isGameMode
            }
        })
    }
})