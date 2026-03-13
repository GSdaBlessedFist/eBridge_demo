// 2026-03-11 13:20
import { PerspectiveCamera } from '@react-three/drei'
import { useEffect } from 'react'
export default function CameraRig() {
    return (
        <group name="Cameras" userData={{ name: 'Cameras' }}>
            <group name="LiveMetricsCam_Target_EMPTY" position={[0.424, 1.477, -0.003]} userData={{ name: 'LiveMetricsCam_Target_EMPTY' }} />
            <group name="OverviewCam_Target_EMPTY" position={[-0.014, 0.93, 0.875]} userData={{ name: 'OverviewCam_Target_EMPTY' }} />
            <group name="OverviewCam_Position_EMPTY" position={[-1.048, 11.208, 3.353]} userData={{ name: 'OverviewCam_Position_EMPTY', fov: 50 }} />
            <group name="DemoMenuCam_Target_EMPTY" position={[-3.109, 0.403, -0.19]} userData={{ name: 'DemoMenuCam_Target_EMPTY' }} />
            <group name="DemoMenuCam_Position_EMPTY" position={[-3.47, 4.619, 4.916]} userData={{ name: 'DemoMenuCam_Position_EMPTY', fov: 50 }} />
            <group name="PowerButtonCam_Target_EMPTY" position={[1.184, 0.735, 1.587]} userData={{ name: 'PowerButtonCam_Target_EMPTY' }} />
            <group name="PowerButtonCam_Position_EMPTY" position={[2.617, 1.936, 2.996]} userData={{ name: 'PowerButtonCam_Position_EMPTY', fov: 50 }} />
            <group name="LiveMetricsCam_Position_EMPTY" position={[12.039, -0.346, -5.89]} userData={{ name: 'LiveMetricsCam_Position_EMPTY', fov: 221 }} />
            <group name="ScaleCam_Target_EMPTY" position={[1.572, 0.357, -1.599]} userData={{ name: 'ScaleCam_Target_EMPTY' }} />
            <group name="ScaleCam_Position_EMPTY" position={[1.626, 0.359, -2.084]} userData={{ name: 'ScaleCam_Position_EMPTY', fov: 50 }} />
            <PerspectiveCamera name="_DemoMenu_Camera_1" makeDefault={false} far={100} near={0.1} fov={22.895} position={[-3.47, 4.619, 4.916]} rotation={[-0.69, -0.055, -0.045]} userData={{ name: '_DemoMenu_Camera' }} />
            <PerspectiveCamera name="_LiveMetrics_Camera_1" makeDefault={false} far={1000} near={0.1} fov={5.246} position={[12.039, -0.346, -5.89]} rotation={[2.841, 1.083, -2.875]} userData={{ name: '_LiveMetrics_Camera' }} />
            <PerspectiveCamera name="_Scale_Camera_1" makeDefault={false} far={1000} near={0.1} fov={22.895} position={[1.626, 0.359, -2.084]} rotation={[-3.138, 0.11, 3.141]} userData={{ name: '_Scale_Camera' }} />
            <PerspectiveCamera name="_PowerButton_Camera_1" makeDefault={false} far={1000} near={0.1} fov={22.895} position={[2.617, 1.936, 2.996]} rotation={[-0.706, 0.659, 0.481]} userData={{ name: '_PowerButton_Camera' }} />
            <PerspectiveCamera name="_Overview_Camera_1" makeDefault={true} far={1000} near={0.1} fov={22.895} position={[1.45, 6.075, 8.08]} rotation={[-0.62, 0.164, 0.116]} userData={{ name: '_Overview_Camera' }} />
            <PerspectiveCamera name="_ROAM_Camera" makeDefault={false} far={1000} near={0.1} fov={22.895} position={[1.846, 1.004, -3.697]} rotation={[-2.774, 0.461, 2.972]} userData={{ name: '_ROAM_Camera' }} />
        </group>
    )
}