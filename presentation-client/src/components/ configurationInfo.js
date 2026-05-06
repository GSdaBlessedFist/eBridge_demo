const modeInfo = {
    ACTIVE_ONLY: {
        title: "ACTIVE_ONLY",
        description: "Only votes from currently connected users count.",
        behavior: "Votes disappear when users leave."
    },
    PERSISTENT: {
        title: "PERSISTENT",
        description: "Votes are stored, accumulating over time.",
        behavior: "Every vote contributes to the total."
    }
}

export default modeInfo