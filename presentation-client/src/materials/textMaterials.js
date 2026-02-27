import { useMemo } from 'react'
import * as THREE from 'three'

export function useTextMaterial(color = 0xffffff, emissive = 0xffffff) {
    return useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            emissive: new THREE.Color(emissive),
            emissiveIntensity: 0.5,
            roughness: 0.5,
            metalness: 0,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true,
        })
    }, [color, emissive])
}