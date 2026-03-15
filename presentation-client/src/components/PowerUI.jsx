// 2026-03-13 16:10
import { useState, useEffect } from "react";
import { Html } from "@react-three/drei";

export default function PowerUI({ powerOn, onClick }) {
    const [visible, setVisible] = useState(false);
    const [render, setRender] = useState(powerOn);

    // Trigger fade in/out based on powerOn
    useEffect(() => {
        if (powerOn) {
            setRender(true)
            // subtle fade-in delay
            const fadeInTimeout = setTimeout(() => setVisible(true), 750) // wait 0.5s
            return () => clearTimeout(fadeInTimeout)
        } else {
            // fade out immediately
            setVisible(false)
            const fadeOutTimeout = setTimeout(() => setRender(false), 300)
            return () => clearTimeout(fadeOutTimeout)
        }
    }, [powerOn])

    if (!render) return null;

    return (
        <div
            onClick={onClick}
            style={{
                position: "absolute",
                top: 10,
                left: 10,
                width: "60px",
                height: "60px",
                borderRadius: "10%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#203454",
                padding: ".21%",
                transition: "transform 0.5s ease-in-out, opacity 0.5s ease-in-out",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
            {/* Inline SVG */}
            <svg viewBox="0 0 541.86665 541.86666" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <path d="M 232.67561,37.854169 V 241.81192 h 81.21923 V 37.854169 Z M 199.90267,98.651678 C 119.31884,129.53848 66.01184,207.68138 66.011599,294.92302 c 4.13e-4,115.90437 92.799281,209.86336 207.272751,209.86391 114.47412,4.5e-4 207.27406,-93.95885 207.27447,-209.86391 4e-5,-87.24119 -53.30617,-165.38395 -133.88924,-196.271342 V 174.8468 c 41.07887,25.73691 66.0778,71.16496 66.07762,120.07622 2.8e-4,77.98607 -62.43957,141.20628 -139.46285,141.20576 -77.02259,-4.8e-4 -139.46141,-63.22038 -139.46113,-141.20576 -3.8e-4,-48.91226 24.99937,-94.34117 66.07945,-120.07798" fill="#ffffff" />
            </svg>
        </div>
    )
}