const modeInfo = {
    STRICT: {
        title: "STRICT",
        description: "Only one vote per participant. New votes replace old ones.",
        behavior: "Live votes overwrite previous choices."
    },
    PERSISTENT: {
        title: "PERSISTENT",
        description: "All votes are stored and accumulated over time.",
        behavior: "Every vote contributes to the total."
    },
    ACTIVE_ONLY: {
        title: "ACTIVE_ONLY",
        description: "Only votes from currently connected users count.",
        behavior: "Votes disappear when users leave."
    }
}