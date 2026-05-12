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

  const displayMode = voteUpdate?.voteMode
  const isGameMode = voteUpdate?.gameMode


  const optionsMap = [
    { id: "red", label: "A", color: "#FF6B6B" },
    { id: "green", label: "B", color: "#4ECDC4" },
    { id: "blue", label: "C", color: "#FFE66D" }
  ]
  const activeVotes = voteUpdate?.votes || {}
  const persistentVotes = voteUpdate?.raceVotes || {}
  const activeTotal = Object.values(activeVotes).reduce((a, b) => a + b, 0)
  const persistentTotal = Object.values(persistentVotes).reduce((a, b) => a + b, 0)

  useEffect(() => {
    console.log("[page::26: activeVotes]", activeVotes)
    console.log("[page::27: persistentVotes]", persistentVotes)
    console.log("[page::28: activeTotal]", activeTotal)
    console.log("[page::29: persistentTotal]", persistentTotal)
  }, []);



  const getPercentage = (count, total) =>
    total === 0 ? 0 : Math.round((count / total) * 100)

  const orderedPercentages = optionsMap.map((opt) => ({
    id: opt.id,
    label: opt.label,
    percent: voteUpdate?.percentages?.[opt.id] ?? 0,
  }))

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
  //---------------------------------------------
  //---------------------------------------------

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
    //console.log("[page.jsx: 65]: ", voteUpdate)
  }, [voteUpdate]);

  useEffect(() => {
    console.log("[page consensus]", consensus)
  }, [consensus])

  useEffect(() => {
    if (!consensusReset) return
    setSelected(false)
    setVoteStatus(null)
    setPendingVote(null)
    setIsCoolingDown(false)

    // setTimeout(() => {
    //   setSelected("")
    // }, 300)
  }, [consensusReset])



  return (
    <main style={{ padding: 20, textAlign: "center" }} className="mx-auto w-screen min-w-72 h-full">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-5xl">Cast Your Vote</h1>
        {/* STATUS */}
        <div className="m-auto w-1/2 h-12 ">
          {voteStatus === "sending" && <p>Sending vote...</p>}
          {voteStatus === "sent" && <p>Vote received ✓</p>}
        </div>

        {/* BUTTONS */}

        <div className="flex">
          {optionsMap.map((option) => (
            <button key={option.label} disabled={isCoolingDown} onClick={() => handleVote(option.id)}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                margin: 10,
                padding: "30px 50px",
                fontSize: 50,
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
        <hr className="w-1/3 mt-8 " />
        {/* MODE INFO */}
        <div className="my-8 opacity-75">
          <strong>Live vs Total Votes</strong>
          <div style={{ fontSize: 16 }}>
            Live = active users &nbsp; • &nbsp; Total = all votes (persistent)
          </div>
        </div>

        <div className="w-full text-3xl ">OPTIONS:</div>
        {/* RESULTS */}
        <div className=" mx-auto  w-1/3  min-w-72 md:w-1/2  flex flex-col lg:flex-row justify-center items-center ">
          {optionsMap.map((option) => {
            const activeCount = activeVotes[option.id] || 0
            const persistentCount = persistentVotes[option.id] || 0
            const activePct = getPercentage(activeCount, activeTotal)
            const persistentPct = getPercentage(persistentCount, persistentTotal)
            const isWinner = consensus === option.id

            // console.log("[page::126: activeCount]", activeCount)
            // console.log("[page::127: persistentCount]", persistentCount)
            // console.log("[page::128: activePct]", activePct)
            // console.log("[page::129: persistentPct]", persistentPct)

            return (
              <div key={option.color} className="m-4 w-full min-w-12 ">
                {/* Label */}
                <div style={{ color: option?.color }} className="text-6xl">{option.label}</div>
                {/* ACTIVE ONLY */}
                <div style={{ fontSize: 14 }}>
                  <span style={{ opacity: 0.7 }}>Live:</span>{" "}
                  {activeCount} votes ({activePct}%)
                </div>
                {/* PERSISTENT */}
                <div style={{ fontSize: 14 }}>
                  <span style={{ opacity: 0.7 }}>Total:</span>{" "}
                  {persistentCount} votes ({persistentPct}%)
                </div>
                {/* Simple visual bars */}
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <div style={{ height: 6, width: `${activePct}%`, background: option.color, opacity: 0.6 }} />
                  <div style={{ height: 6, width: `${persistentPct}%`, background: option.color }} />
                </div>
              </div>
            )
          })}
        </div>


        {/* <div className="m-auto w-3/5 lg:w-1/3 grid grid-cols-3 grid-row-1 gap-4 text-center">
        </div> */}
        {consensus && isGameMode && (
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
      </div>
    </main >
  )
}