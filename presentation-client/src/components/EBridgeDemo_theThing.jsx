import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from "three"
import { useGLTF, PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useTextMaterial } from '@/materials/textMaterials'
import LiveMetrics from './LiveMetrics'
import { startFakeVoteStream } from '@/utils/fakeVoteStream'
import VoteButtons from './VoteButtons'

export default function Model(props) {
  const { nodes, materials } = useGLTF('/models/eBridgeDemo_theThing.glb')
  const { gl } = useThree()

  const demoTextsRef = useRef(); // name="DemoTexts"
  const buttonRefs = [useRef(), useRef(), useRef(), useRef()]

  const baseYRef = useRef([])
  const phaseRef = useRef([])

  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [selectedButton, setSelectedButton] = useState(null); // null or 0-3

  const textMaterials = [
    useTextMaterial(0xffffff, 0xffaa00),
    useTextMaterial(0xffffff, 0xffaa00),
    useTextMaterial(0xffffff, 0xffaa00),
    useTextMaterial(0xffffff, 0xffaa00),
  ]

  useEffect(() => {
    const liveMetricsMat = materials.live_metrics
    const assemblyMat = materials.assembly
    const configurationMat = materials.configuration
    const scaleMat = materials.scale
    const demoTextMaterials = [
      liveMetricsMat,
      assemblyMat,
      configurationMat,
      scaleMat
    ]

    demoTextMaterials.forEach(mat => {
      if (mat.map) {
        mat.map.anisotropy = gl.capabilities.getMaxAnisotropy()
        mat.map.minFilter = THREE.LinearMipMapLinearFilter
        mat.map.magFilter = THREE.LinearFilter
        mat.map.needsUpdate = true
      }
    })

    //Powerbutton
    const powerButtonMat = materials.powerButton

    if (powerButtonMat.map) {
      powerButtonMat.map.anisotropy = gl.capabilities.getMaxAnisotropy()
      powerButtonMat.map.minFilter = THREE.LinearMipMapLinearFilter
      powerButtonMat.map.magFilter = THREE.LinearFilter
      powerButtonMat.map.needsUpdate = true
    }
  }, [materials, gl])

  ////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////


  ////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////

  useLayoutEffect(() => {
    if (!demoTextsRef.current) return

    const PHASE = -0.6

    const children = demoTextsRef.current.children

    baseYRef.current = children.map(c => c.position.y)
    phaseRef.current = children.map((_, i) => i * PHASE)

    console.log("Stored baseY:", baseYRef.current)
    console.log("Stored phases:", phaseRef.current)
  }, [])

  //---------------------------------

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    const demoTexts = demoTextsRef.current?.children
    if (!demoTexts || demoTexts.length === 0) return

    // Oscillation
    demoTexts.forEach((text, i) => {
      if (baseYRef.current[i] === undefined) return
      text.position.y =
        baseYRef.current[i] +
        Math.sin(t * 2 + phaseRef.current[i]) * 0.025
    })

    // DemoText hover glow
    demoTexts.forEach((text, i) => {
      if (!text.material) return

      // Ensure emissive exists (for MeshStandardMaterial)
      if (!text.material.emissive) text.material.emissive = new THREE.Color(0xffffff)
      if (text.material.emissiveIntensity === undefined) text.material.emissiveIntensity = 1

      const target = hoveredIndex === i ? 17 : 1
      text.material.emissiveIntensity =
        THREE.MathUtils.lerp(text.material.emissiveIntensity, target, 0.1)
    })

    // Button hover glow
    buttonRefs.forEach((ref, i) => {
      if (!ref.current) return

      const target = hoveredIndex === i ? 17 : 1

      ref.current.material.emissiveIntensity =
        THREE.MathUtils.lerp(ref.current.material.emissiveIntensity, target, 0.1)
    })
  })




  //////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////
  return (
    <group {...props} dispose={null}>
      <group name="Scene">
        <group name="Scene_Collection" userData={{ name: 'Scene Collection' }}>
          <group name="Cameras" userData={{ name: 'Cameras' }}>
            <PerspectiveCamera name="demoMenu_Camera_1" makeDefault={false} far={100} near={0.1} fov={22.895} position={[-3.449, 4.263, 4.181]} rotation={[-0.724, -0.066, -0.162]} userData={{ name: 'demoMenu_Camera' }} />
            <PerspectiveCamera name="liveMetrics_Camera_1" makeDefault={true} far={1000} near={0.1} fov={8.273} position={[8.579, -0.557, 5.125]} rotation={[0.37, 0.977, -0.311]} userData={{ name: 'liveMetrics_Camera' }} />
            <PerspectiveCamera name="scale_Camera_1" makeDefault={false} far={1000} near={0.1} fov={22.895} position={[1.638, 0.359, -2.084]} rotation={[-3.072, 0.379, 3.116]} userData={{ name: 'scale_Camera' }} />
            <PerspectiveCamera name="ROAM" makeDefault={false} far={1000} near={0.1} fov={22.895} position={[4.489, 3.651, 5.979]} rotation={[-0.452, 0.539, 0.244]} userData={{ name: 'ROAM' }} />
          </group>
          <group name="THE_THING" userData={{ name: 'THE_THING' }}>
            <group name="Module_MainBody" userData={{ name: 'Module_MainBody' }}>
              <group name="mainBody" userData={{ name: 'mainBody' }}>
                <mesh name="mainBody_1" castShadow receiveShadow geometry={nodes.mainBody_1.geometry} material={materials.mainBody} />
                <mesh name="mainBody_2" castShadow receiveShadow geometry={nodes.mainBody_2.geometry} material={materials.topHiddenPanelBorder} />
                <mesh name="mainBody_3" castShadow receiveShadow geometry={nodes.mainBody_3.geometry} material={materials.mainBodyGrooveLights} />
                <mesh name="mainBody_4" castShadow receiveShadow geometry={nodes.mainBody_4.geometry} material={materials.liveDataLight} />
                <group name="dataPort" userData={{ name: 'dataPort' }}>
                  <mesh name="dataPort_1" castShadow receiveShadow geometry={nodes.dataPort_1.geometry} material={materials.dataPort} />
                  <mesh name="dataPort_2" castShadow receiveShadow geometry={nodes.dataPort_2.geometry} material={materials.dataCable} />
                </group>
              </group>
              <mesh name="powerButtonBorder" castShadow receiveShadow geometry={nodes.powerButtonBorder.geometry} material={materials.buttonBorder} userData={{ name: 'powerButtonBorder' }}>
                <mesh name="powerButton" castShadow receiveShadow geometry={nodes.powerButton.geometry} material={materials.powerButton} morphTargetDictionary={nodes.powerButton.morphTargetDictionary} morphTargetInfluences={nodes.powerButton.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'powerButton' }} />
              </mesh>
              <group name="mainScreenPort_A" userData={{ name: 'mainScreenPort_A' }}>
                <mesh name="mainScreenPort_A_1" castShadow receiveShadow geometry={nodes.mainScreenPort_A_1.geometry} material={materials.mainScreenPort_rim} />
                <mesh name="mainScreenPort_A_2" castShadow receiveShadow geometry={nodes.mainScreenPort_A_2.geometry} material={materials.mainScreenPort_inside} />
              </group>
            </group>
            <group name="Top_HiddenPanel" userData={{ name: 'Top_HiddenPanel' }}>
              <group name="topHiddenPanel_A" userData={{ name: 'topHiddenPanel_A' }}>
                <mesh name="topHiddenPanel_A_1" castShadow receiveShadow geometry={nodes.topHiddenPanel_A_1.geometry} material={materials.mainBody} />
                <mesh name="topHiddenPanel_A_2" castShadow receiveShadow geometry={nodes.topHiddenPanel_A_2.geometry} material={materials.topHiddenPanelBorder} />
                <mesh name="topHiddenPanel_A_3" castShadow receiveShadow geometry={nodes.topHiddenPanel_A_3.geometry} material={materials.topHiddenPanelScreen} />
              </group>
            </group>
            <group name="Module_DemoScreen" userData={{ name: 'Module_DemoScreen' }}>
              <group name="demoScreenBase_A" userData={{ name: 'demoScreenBase_A' }}>
                <mesh name="demoScreenBase_A_1" castShadow receiveShadow geometry={nodes.demoScreenBase_A_1.geometry} material={materials.demoScreenBase} />
                <mesh name="demoScreenBase_A_2" castShadow receiveShadow geometry={nodes.demoScreenBase_A_2.geometry} material={materials.demoScreenBG} />
                <mesh name="demoScreenGlass" castShadow receiveShadow geometry={nodes.demoScreenGlass.geometry} material={materials.demoScreenGlass} userData={{ name: 'demoScreenGlass' }} />
              </group>
              <mesh name="demoScreenTextPlane" castShadow receiveShadow geometry={nodes.demoScreenTextPlane.geometry} material={materials.demoScreenGlass} userData={{ name: 'demoScreenTextPlane' }} />
            </group>
            <group name="Module_UIButtons" userData={{ name: 'Module_UIButtons' }}>
              <mesh name="uiButtonsBorder" castShadow receiveShadow geometry={nodes.uiButtonsBorder.geometry} material={materials.buttonBorder} userData={{ name: 'uiButtonsBorder' }}>
                {/* <mesh name="uiButton_1" castShadow receiveShadow geometry={nodes.uiButton_1.geometry} material={materials.uiButton_1} morphTargetDictionary={nodes.uiButton_1.morphTargetDictionary} morphTargetInfluences={nodes.uiButton_1.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'uiButton_1' }} />
                <mesh name="uiButton_2" castShadow receiveShadow geometry={nodes.uiButton_2.geometry} material={materials.uiButton_2} morphTargetDictionary={nodes.uiButton_2.morphTargetDictionary} morphTargetInfluences={nodes.uiButton_2.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'uiButton_2' }} />
                <mesh name="uiButton_3" castShadow receiveShadow geometry={nodes.uiButton_3.geometry} material={materials.uiButton_3} morphTargetDictionary={nodes.uiButton_3.morphTargetDictionary} morphTargetInfluences={nodes.uiButton_3.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'uiButton_3' }} /> */}
                <VoteButtons nodes={nodes} materials={materials} />
              </mesh>
            </group>
            <group name="Bottom_HiddenDrawer" userData={{ name: 'Bottom_HiddenDrawer' }}>
              <group name="bottomHiddenDrawer_A" userData={{ name: 'bottomHiddenDrawer_A' }}>
                <mesh name="bottomHiddenDrawer_A_1" castShadow receiveShadow geometry={nodes.bottomHiddenDrawer_A_1.geometry} material={materials.bottomHiddenDrawer} />
                <mesh name="bottomHiddenDrawer_A_2" castShadow receiveShadow geometry={nodes.bottomHiddenDrawer_A_2.geometry} material={materials.bottomHiddenDrawer_inside} />
              </group>
            </group>
            <group name="Module_DemoButtons" userData={{ name: 'Module_DemoButtons' }}>
              <mesh name="demoButtonsBorder" castShadow receiveShadow geometry={nodes.demoButtonsBorder.geometry} material={materials.demoButtonsBorder} userData={{ name: 'demoButtonsBorder' }} />
              <mesh name="demoButton_1" ref={buttonRefs[0]} castShadow receiveShadow geometry={nodes.demoButton_1.geometry} material={materials.demoButton_1} morphTargetDictionary={nodes.demoButton_1.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_1.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'demoButton_1' }} />
              <mesh name="demoButton_2" ref={buttonRefs[1]} castShadow receiveShadow geometry={nodes.demoButton_2.geometry} material={materials.demoButton_2} morphTargetDictionary={nodes.demoButton_2.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_2.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'demoButton_2' }} />
              <mesh name="demoButton_3" ref={buttonRefs[2]} castShadow receiveShadow geometry={nodes.demoButton_3.geometry} material={materials.demoButton_3} morphTargetDictionary={nodes.demoButton_3.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_3.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'demoButton_3' }} />
              <mesh name="demoButton_4" ref={buttonRefs[3]} castShadow receiveShadow geometry={nodes.demoButton_4.geometry} material={materials.demoButton_4} morphTargetDictionary={nodes.demoButton_4.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_4.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'demoButton_4' }} />
            </group>
            <group name="DemoTexts" ref={demoTextsRef} userData={{ name: 'DemoTexts' }}>
              <mesh name="demoText_live_metrics" geometry={nodes.demoText_live_metrics.geometry} material={materials.live_metrics}
                onPointerOver={() => setHoveredIndex(0)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => console.log("Click")}
              />
              <mesh name="demoText_assembly" geometry={nodes.demoText_assembly.geometry} material={materials.assembly}
                onPointerOver={() => setHoveredIndex(1)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => console.log("Click")}
              />
              <mesh name="demoText_configuration" geometry={nodes.demoText_configuration.geometry} material={materials.configuration}
                onPointerOver={() => setHoveredIndex(2)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => console.log("Click")}
              />
              <mesh name="demoText_scale" geometry={nodes.demoText_scale.geometry} material={materials.scale}
                onPointerOver={() => setHoveredIndex(3)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => console.log("Click")}
              />
            </group>
            {/* <group name="LiveMetrics" userData={{ name: 'LiveMetrics' }}>
              <group name="LiveMetricFocus_EMPTY" position={[0.424, 1.431, -0.003]} scale={0.129} userData={{ name: 'LiveMetricFocus_EMPTY' }} />
              <mesh name="liveMetricBar_3" castShadow receiveShadow geometry={nodes.liveMetricBar_3.geometry} material={materials.liveMetricBar_3} userData={{ name: 'liveMetricBar_3' }} />
              <mesh name="liveMetricBar_1" castShadow receiveShadow geometry={nodes.liveMetricBar_1.geometry} material={materials.liveMetricBar_1} userData={{ name: 'liveMetricBar_1' }} />
              <mesh name="liveMetricBar_2" castShadow receiveShadow geometry={nodes.liveMetricBar_2.geometry} material={materials.liveMetricBar_2} userData={{ name: 'liveMetricBar_2' }} />
            </group> */}
            <LiveMetrics nodes={nodes} materials={materials} />
            <group name="Scale" userData={{ name: 'Scale' }}>
              <mesh name="mainBodyGrooveRails" castShadow receiveShadow geometry={nodes.mainBodyGrooveRails.geometry} material={nodes.mainBodyGrooveRails.material} position={[0, 0.017, 0]} userData={{ name: 'mainBodyGrooveRails' }} />
            </group>
          </group>
        </group>
      </group>
    </group >
  )
}

useGLTF.preload('/models/eBridgeDemo_theThing.glb')
