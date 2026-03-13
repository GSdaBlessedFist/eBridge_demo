// 2026-03-03 22:05
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { useControls } from "leva"

export default function PostProcessing() {

    const {
        bloomIntensity,
        luminanceThreshold,
        luminanceSmoothing,
        bloomRadius,
        mipmapBlur,
        vignetteOffset,
        vignetteDarkness
    } = useControls("Post Processing", {
        bloomIntensity: { value: .5, min: 0, max: 5, step: 0.1 },
        luminanceThreshold: { value: 0.6, min: 0, max: 1, step: 0.01 },
        luminanceSmoothing: { value: 0.9, min: 0, max: 1, step: 0.01 },
        bloomRadius: { value: 0.65, min: 0, max: 2, step: 0.01 },
        mipmapBlur: true,

        vignetteOffset: { value: 0.1, min: 0, max: 1, step: 0.01 },
        vignetteDarkness: { value: 1.1, min: 0, max: 3, step: 0.01 }
    })

    return (
        <EffectComposer>
            <Bloom
                intensity={0.1}
                luminanceThreshold={luminanceThreshold}
                luminanceSmoothing={luminanceSmoothing}
                radius={0.1}
                mipmapBlur={mipmapBlur}
            />

            <Vignette
                eskil={true}
                offset={vignetteOffset}
                darkness={vignetteDarkness}
            />
        </EffectComposer>
    )
}

