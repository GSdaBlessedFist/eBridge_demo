// 2026-04-16 14:18
"use client"

import { useEffect, useState } from "react"
import { useVoteSocket } from "@/src/hooks/useVoteSocket"

export default function VotePage() {
  const { castVote, voteUpdate, consensus, consensusReset } = useVoteSocket("room-123")
  const [voteStatus, setVoteStatus] = useState(null);
  const [selected, setSelected] = useState(null)
  const [isCoolingDown, setIsCoolingDown] = useState(false)
  const [pendingVote, setPendingVote] = useState(null)

  //const options = ["A", "B", "C"]
  const optionsMap = [
    { id: "red", label: "A", color: "#FF6B6B" },
    { id: "green", label: "B", color: "#4ECDC4" },
    { id: "blue", label: "C", color: "#FFE66D" }
  ]

  const handleVote = (id) => {
    if (isCoolingDown) return

    setSelected(id)
    setVoteStatus("sending")
    setIsCoolingDown(true)
    setPendingVote(id)

    castVote(id)

    setTimeout(() => {
      setVoteStatus("sent")

      setTimeout(() => {
        setVoteStatus(null)
      }, 1000)

      // unlock after 1 second (matches server limiter)
      setTimeout(() => {
        setIsCoolingDown(false)
      }, 1000)

    }, 300)
  }

  useEffect(() => {
    if (!pendingVote) return

    setVoteStatus("sent")
    setPendingVote(null)

    setTimeout(() => {
      setVoteStatus(null)
      setIsCoolingDown(false)
    }, 1000)

  }, [voteUpdate])

  useEffect(() => {
    console.log(voteUpdate)
  }, [voteUpdate]);

  useEffect(() => {
    if (!consensusReset) return

    setSelected(null)
    setVoteStatus(null)
    setPendingVote(null)
    setIsCoolingDown(false)
  }, [consensusReset])

  const orderedPercentages = optionsMap.map((opt) => ({
    id: opt.id,
    label: opt.label,
    percent: voteUpdate?.percentages?.[opt.id] ?? 0,
  }))

  return (
    <main style={{ padding: 20, textAlign: "center" }}>
      <h1 className="text-5xl">Cast Your Vote</h1>
      <div className="m-auto w-1/2 h-8 ">
        {voteStatus === "sending" && <p>Sending vote...</p>}
        {voteStatus === "sent" && <p>Vote received ✓</p>}
      </div>


      <div className="my-5 ">
        {optionsMap.map((option) => (
          <button
            key={option.label}
            disabled={isCoolingDown}
            onClick={() => handleVote(option.id)}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            style={{
              margin: 10,
              padding: "20px 40px",
              fontSize: 18,
              background: selected === option.id ? option.color : "#444",
              color: "white",
              border: "none",
              borderRadius: 8,
              opacity: isCoolingDown ? 0.6 : 1,
              cursor: isCoolingDown ? "not-allowed" : "pointer",
              transition: "transform 0.1s ease, background 0.2s ease"
            }}
          >
            {option.label}
          </button>
        ))}



      </div>
      <div className="mb-8 w-full text-3xl">OPTIONS:</div>
      <div className="m-auto w-3/5 lg:w-1/3 grid grid-cols-3 grid-row-1 gap-4 text-center">
        {/* {orderedPercentages.map((item) => (
          <div key={item.id} className="text-4xl  col-span-1">
            <span style={{ fontSize: "3.5rem", color: optionsMap.find(o => o.id === item.id)?.color }}>{item.label}</span>:{Math.round(item.percent)}% &nbsp;
          </div>
        ))} */}
        {orderedPercentages.map((item) => {
          const option = optionsMap.find(o => o.id === item.id)
          const isWinner = consensus === item.id

          return (
            <div
              key={item.id}
              className="text-4xl rounded transition-all duration-300"
              style={{
                transform: isWinner ? "scale(1.15)" : "scale(1)",
                boxShadow: isWinner ? "0 0 20px rgba(255,255,255,0.6)" : "none",
                opacity: consensus && !isWinner ? 0.4 : 1
              }}
            >
              <span
                style={{
                  fontSize: "3.5rem",
                  color: option?.color
                }}
              >
                {item.label}
              </span>
              : {Math.round(item.percent)}%
            </div>
          )
        })}
      </div>
      {
        consensus && (
          <div style={{
            margin: "50px auto",
            padding: "15px",
            background: "#222",
            color: "white",
            borderRadius: 10,
            fontSize: 50
          }} className="w-3/5 lg:w-1/3">
            Winner: {
              optionsMap.find(o => o.id === consensus)?.label ?? consensus
            } 🎉
          </div>
        )
      }
    </main >
  )
}