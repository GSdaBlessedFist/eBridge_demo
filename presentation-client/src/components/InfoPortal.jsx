// 2026-03-11 14:30
import { useEffect, useState } from 'react'
//import { createPortal } from 'react-dom'

export default function InfoPortal({ children }) {
    const [visible, setVisible] = useState(false)

    return (<>
        {children}
    </>)
}