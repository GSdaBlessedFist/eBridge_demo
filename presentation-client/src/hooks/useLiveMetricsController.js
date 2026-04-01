// 2026-04-01 11:15

import { useRef } from 'react';
import { useVoteStore } from '../stores/useVoteStore';
import * as THREE from 'three';
import colorMap from '@/components/colorMap';

export function useLiveMetricsController() {
    const barRefs = {
        red: useRef(null),
        green: useRef(null),
        blue: useRef(null),
    };

    const currentScale = useRef({ red: 0, green: 0, blue: 0 }).current;
    const lerpFactor = 0.1;
    const maxHeight = 1;
    const maxEmissive = 2;

    // function update(powerOn, isMetricsCamera) {
    //     if (!powerOn) return;

    //     const { percentages, consensusColor } = useVoteStore.getState();

    //     Object.keys(barRefs).forEach((color) => {
    //         const mesh = barRefs[color].current;
    //         if (!mesh) return

    //         // --- Visibility ---
    //         mesh.material.opacity = isMetricsCamera ? 1 : 0;
    //         mesh.material.transparent = true;

    //         // --- Height animation ---
    //         const targetScale = (percentages[color] || 0) / 100;
    //         currentScale[color] += (targetScale - currentScale[color]) * lerpFactor;
    //         mesh.scale.y = currentScale[color] * maxHeight;

    //         // ✅ Debug: log the updated scale
    //         //console.log(`[LiveMetrics] ${color} scale.y =`, mesh.scale.y);


    //         // --- Emissive animation ---
    //         let intensityFactor = targetScale;
    //         if (consensusColor === color) intensityFactor = 1;

    //         const finalColor = colorMap[color].clone().multiplyScalar(intensityFactor * maxEmissive);
    //         mesh.material.emissive.copy(finalColor);
    //         mesh.material.needsUpdate = true;
    //     });
    // }

    function update(powerOn) {
        if (!powerOn) {
            console.log("[LiveMetrics] Power is off, skipping update");
            return;
        }

        const { percentages, consensusColor } = useVoteStore.getState();
        console.log("[LiveMetrics] percentages:", percentages, "consensusColor:", consensusColor);

        Object.keys(barRefs).forEach((color) => {
            const mesh = barRefs[color].current;

            if (!mesh) {
                console.warn(`[LiveMetrics] ${color} ref not ready yet`);
                return;
            } else {
                console.log(`[LiveMetrics] ${color} mesh loaded, currentScale:`, currentScale[color]);
            }

            // Height animation
            const targetScale = (percentages[color] || 0) / 100;
            console.log(`[LiveMetrics] ${color} targetScale:`, targetScale);

            currentScale[color] += (targetScale - currentScale[color]) * lerpFactor;
            console.log(`[LiveMetrics] ${color} new currentScale:`, currentScale[color]);

            mesh.scale.y = currentScale[color] * maxHeight;
            console.log(`[LiveMetrics] ${color} mesh.scale.y set to:`, mesh.scale.y);

            // Emissive animation
            let intensityFactor = targetScale;
            if (consensusColor === color) intensityFactor = 1;

            const finalColor = colorMap[color].clone().multiplyScalar(intensityFactor * maxEmissive);
            mesh.material.emissive.copy(finalColor);
            mesh.material.needsUpdate = true;
        });
    }

    function resetBars() {
        Object.keys(barRefs).forEach((color) => {
            const mesh = barRefs[color].current;
            if (!mesh) return;
            mesh.scale.y = 0;
            mesh.material.emissiveIntensity = 0;
            currentScale[color] = 0;
            mesh.material.opacity = 0;
        });
    }

    return { barRefs, update, resetBars };
}