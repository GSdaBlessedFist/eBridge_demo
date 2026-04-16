// 2026-04-16 14:18
"use client"

import { useState } from "react"
import { useVoteSocket } from "@/src/hooks/useVoteSocket"

export default function VotePage() {
  const { castVote } = useVoteSocket("room-123")
  const [selected, setSelected] = useState(null)

  //const options = ["A", "B", "C"]
  const optionsMap = [
    { id: "red", label: "A", color: "#FF6B6B" },
    { id: "green", label: "B", color: "#4ECDC4" },
    { id: "blue", label: "C", color: "#FFE66D" }
  ]

  const handleVote = (id: string) => {
    setSelected(id)
    castVote(id)
  }

  return (
    <main style={{ padding: 20, textAlign: "center" }}>
      <h1>Cast Your Vote</h1>

      <div style={{ marginTop: 20 }}>
        {optionsMap.map((option) => (
          <button
            key={option.label}
            onClick={() => handleVote(option.id)}
            style={{
              margin: 10,
              padding: "20px 40px",
              fontSize: 18,
              background: selected === option.id ? option.color : "#444",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer"
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </main>
  )
}