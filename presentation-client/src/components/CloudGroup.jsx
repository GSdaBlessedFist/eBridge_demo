import { Cloud } from "@react-three/drei";
import { useControls } from "leva";
import { memo, useEffect, useRef } from "react";

const CloudGroup = memo(function CloudGroup() {
    const underMainBodyCloudPointRef = useRef()

    return (
        <group
            ref={underMainBodyCloudPointRef}
            name="underMainBodyCloud_point"
            position={[-1, -2.5, -2]}
        >
            <Cloud
                opacity={0.035}
                speed={0.075}
                width={3}
                depth={15}
                segments={10}
                color="#42cefc"
            />
        </group>
    )
})

export default CloudGroup