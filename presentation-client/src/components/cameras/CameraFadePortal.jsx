// 2026-03-11 14:30
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function CameraFadePortal({ duration = 750, onReady }) {
    const [visible, setVisible] = useState(false)
    const [mounted, setMounted] = useState(false);


    const triggerFade = (midpointAction) => {
        setVisible(true)

        setTimeout(() => {
            midpointAction()
        }, duration / 2)

        setTimeout(() => {
            setVisible(false)
        }, duration)
    }

    useEffect(() => {
        //console.log("Fade portal registering trigger")
        if (onReady) onReady(triggerFade)
    }, [])

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;
    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'black',
                opacity: visible ? 1 : 0,
                transition: `opacity ${duration / 2}ms ease`,
                pointerEvents: 'none',
                zIndex: 900,
            }}
        />,
        document.body
    )
}