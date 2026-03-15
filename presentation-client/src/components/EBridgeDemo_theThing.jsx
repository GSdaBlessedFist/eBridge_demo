import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSpring } from '@react-spring/three'
import { useGLTF, PerspectiveCamera, useAnimations, Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from "three"
import LiveMetrics from './LiveMetrics'
import { startFakeVoteStream } from '@/utils/fakeVoteStream'
import VoteButtons from './VoteButtons'
import { usePresentationSocket } from '@/hooks/usePresentationSocket'
import { useControls } from 'leva'
import { useCameraAnimationController } from '@/hooks/useCameraAnimationController'
import CameraRig from './cameras/CameraRig'
import CameraManager from './cameras/CameraManager'
import CameraFadePortal from './cameras/CameraFadePortal'
import { useCameraStore } from '@/stores/useCameraStore'
import PowerUI from './PowerUI'

export default function Model({ powerOn, setPowerOn }) {
  const { resetVotes } = usePresentationSocket("room-123")
  const group = useRef()
  const { scene, nodes, materials, animations } = useGLTF('/models/eBridgeDemo_theThing.glb')
  const { actions } = useAnimations(animations, group)
  const { play } = useCameraAnimationController(actions)
  const { gl } = useThree()

  const demoTextsRef = useRef(); // name="DemoTexts"
  const buttonRefs = [useRef(), useRef(), useRef(), useRef()]
  const baseYRef = useRef([])
  const phaseRef = useRef([])
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [selectedButton, setSelectedButton] = useState(null); // null or 0-3
  const setCamera = useCameraStore((state) => state.setCamera)

  const [menuStripeActivated, setMenuStripeActivated] = useState(false);

  const menuBGStripeRef = useRef();

  function menuStripeActivate(t) {
    if (!menuStripeActivated) return
    if (!powerOn) setMenuStripeActivated(false)
    if (menuStripeActivated) {
      menuBGStripeRef.current.position.x += Math.sin(t * 1.5) * .005;
    }
  }

  function handleShutdown() {
    console.log("System shutting down")
    setPowerOn(false)
    setCamera("_Overview_Camera_1")
  }
  ////////////////////////////////////////////////////////////
  //////////////////////////SPRINGS////////////////////////////
  const { intensity } = useSpring({
    intensity: powerOn ? 5 : 0.5,
    config: powerOn
      ? { tension: 170, friction: 12 }   // energetic overshoot
      : { tension: 120, friction: 26 }   // damped, no bounce
  })
  ////////////////////////////////////////////////////////////
  ///////////////////////LEVA////////////////////////////////
  const {
    menu_pinLightIntensity, menu_pinLightColor, liveMetrics_pinLightIntensity, liveMetrics_pinLightColor
  } = useControls("menuSpotLight", {
    menu_pinLightIntensity: { value: 40, min: 0, max: 500, step: 0.1 },
    menu_pinLightColor: { value: "#90b6ff" },
    liveMetrics_pinLightIntensity: { value: 40, min: 0, max: 500, step: 0.1 },
    liveMetrics_pinLightColor: { value: "#90b6ff" },
  })
  ////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////

  // Play initial Overview zoom on load
  // useEffect(() => {
  //   if (actions?.['Overview_zoom']) {
  //     play('Overview_zoom')
  //   }
  // }, [actions])

  //Text materials transparent
  useEffect(() => {
    const demoTexts = demoTextsRef.current?.children
    if (!demoTexts) return

    demoTexts.forEach((text) => {
      text.material.transparent = true
      text.material.opacity = powerOn ? 1 : 0
    })
  }, [])

  useEffect(() => {
    materials.mainBodyGrooveLights.emissiveIntensity = 1
    materials.liveDataLight.emissiveIntensity = 1
  }, [materials])

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

  useLayoutEffect(() => {
    if (!demoTextsRef.current) return
    const PHASE = -0.6
    const children = demoTextsRef.current.children
    baseYRef.current = children.map(c => c.position.y)
    phaseRef.current = children.map((_, i) => i * PHASE)
    console.log("Stored baseY:", baseYRef.current)
    console.log("Stored phases:", phaseRef.current)
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const demoTexts = demoTextsRef.current?.children
    const targetOpacity = powerOn ? 1 : 0

    if (!demoTexts || demoTexts.length === 0) return

    // DemoText fade
    demoTexts.forEach((text) => {
      if (!text.material) return

      text.material.transparent = true

      text.material.opacity = THREE.MathUtils.lerp(
        text.material.opacity ?? 0,
        targetOpacity,
        0.2
      )
    })

    // DemoText Oscillation
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
    // DemoTextButtons hover glow
    buttonRefs.forEach((ref, i) => {
      if (!ref.current) return
      const target = hoveredIndex === i ? 17 : 1
      ref.current.material.emissiveIntensity =
        THREE.MathUtils.lerp(ref.current.material.emissiveIntensity, target, 0.1)
    })
    // slow breathing glow
    materials.powerButton.emissiveIntensity =
      1 + Math.sin(t * 2) * 0.35
    // Apply spring to system lights
    const i = intensity.get()
    materials.mainBodyGrooveLights.emissiveIntensity = i
    materials.liveDataLight.emissiveIntensity = i

    // Menu stripe
    menuStripeActivate(t)
  })
  //////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////
  return (<>
    <group ref={group} dispose={null}>
      <group name="Scene">
        <group name="Scene_Collection" userData={{ name: 'Scene Collection' }}>
          <CameraRig />
          <group name="THE_THING" userData={{ name: 'THE_THING' }}>
            <group name="Module_MainBody" userData={{ name: 'Module_MainBody' }}>
              <group name="mainBody" userData={{ name: 'mainBody' }}>
                <mesh name="mainBody_1" castShadow receiveShadow geometry={nodes.mainBody_1.geometry} material={materials.mainBody} />
                <mesh name="mainBody_2" castShadow receiveShadow geometry={nodes.mainBody_2.geometry} material={materials.mainBodyGrooveLights} />
                <mesh name="mainBody_3" castShadow receiveShadow geometry={nodes.mainBody_3.geometry} material={materials.liveDataLight} />
                <group name="dataPort" userData={{ name: 'dataPort' }}>
                  <mesh name="dataPort_1" castShadow receiveShadow geometry={nodes.dataPort_1.geometry} material={materials.mainBody} />
                  <mesh name="dataPort_2" castShadow receiveShadow geometry={nodes.dataPort_2.geometry} material={materials.dataCable} />
                </group>
              </group>
              <mesh name="powerButtonBorder" castShadow receiveShadow geometry={nodes.powerButtonBorder.geometry} material={materials.buttonBorder} userData={{ name: 'powerButtonBorder' }}>
                <mesh name="powerButton" geometry={nodes.powerButton.geometry} material={materials.powerButton} morphTargetDictionary={nodes.powerButton.morphTargetDictionary} morphTargetInfluences={nodes.powerButton.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'powerButton' }}
                  onClick={() => {
                    setPowerOn(true);
                    setMenuStripeActivated(prev => !prev)
                    setTimeout(() => {
                      setCamera("demoMenu")
                    }, 1500)
                  }}
                />
              </mesh>
              <group name="mainScreenPort_A" userData={{ name: 'mainScreenPort_A' }}>
                <mesh name="mainScreenPort_A_1" castShadow receiveShadow geometry={nodes.mainScreenPort_A_1.geometry} material={materials.mainScreenPort_rim} />
                <mesh name="mainScreenPort_A_2" castShadow receiveShadow geometry={nodes.mainScreenPort_A_2.geometry} material={materials.mainScreenPort_inside} />
              </group>
            </group>
            <group name="Top_HiddenPanel" userData={{ name: 'Top_HiddenPanel' }}>
              <mesh name="topHiddenPanel_A" castShadow receiveShadow geometry={nodes.topHiddenPanel_A.geometry} material={materials.mainBody} userData={{ name: 'topHiddenPanel_A' }} />
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
                <VoteButtons nodes={nodes} materials={materials} powerOn={powerOn} />
              </mesh>
            </group>
            <group name="Bottom_HiddenDrawer" userData={{ name: 'Bottom_HiddenDrawer' }}>
              <group name="bottomHiddenDrawer_A" userData={{ name: 'bottomHiddenDrawer_A' }}>
                <mesh name="bottomHiddenDrawer_A_1" castShadow receiveShadow geometry={nodes.bottomHiddenDrawer_A_1.geometry} material={materials.mainBody} />
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
                onClick={() => {
                  setCamera("metrics")
                }}
              />
              <mesh name="demoText_assembly" geometry={nodes.demoText_assembly.geometry} material={materials.assembly}
                onPointerOver={() => setHoveredIndex(1)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => {
                  setCamera("metrics")
                }}
              />
              <mesh name="demoText_configuration" geometry={nodes.demoText_configuration.geometry} material={materials.configuration}
                onPointerOver={() => setHoveredIndex(2)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => {
                  setCamera("metrics")
                }}
              />
              <mesh name="demoText_scale" geometry={nodes.demoText_scale.geometry} material={materials.scale}
                onPointerOver={() => setHoveredIndex(3)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => {
                  setCamera("scale")
                }}
              />
            </group>
            <LiveMetrics nodes={nodes} materials={materials} powerOn={powerOn} />
            <group name="Scale" userData={{ name: 'Scale' }}>
              <mesh name="mainBodyGrooveRails" castShadow receiveShadow geometry={nodes.mainBodyGrooveRails.geometry} material={materials.scaleRails} position={[0, 0.017, 0]} userData={{ name: 'mainBodyGrooveRails' }} />
            </group>
            <group name="Lights" userData={{ name: 'Lights' }}>
              <group name="menu_pinLight_Target_EMPTY" position={[-1.375, 0.616, -0.04]} userData={{ name: 'menu_pinLight_Target_EMPTY' }} />
              <group name="liveMetrics_pinLight_Target_EMPTY" position={[1.473, 1.292, -0.348]} userData={{ name: 'liveMetrics_pinLight_Target_EMPTY' }} />
              <pointLight name="menu_pinLight" intensity={menu_pinLightIntensity} decay={2} color={menu_pinLightColor} position={[-0.658, 1.65, -2.358]} rotation={[-2.722, 0.275, 3.021]} userData={{ name: 'menu_pinLight' }} />
              <pointLight name="liveMetrics_pinLight" intensity={liveMetrics_pinLightIntensity} decay={2} color={liveMetrics_pinLightColor} position={[3.974, 1.672, -0.618]} rotation={[-2.187, 1.387, 2.195]} userData={{ name: 'liveMetrics_pinLight' }} />
            </group>
            <group name="BG_Panels" userData={{ name: 'BG_Panels' }}>
              <group name="menuStripe" position={[1.5, 0, 0]}>
                <mesh ref={menuBGStripeRef} name="menu_bg_panel" castShadow receiveShadow geometry={nodes.menu_bg_panel.geometry} material={materials.menu_bg_panel} userData={{ name: 'menu_bg_panel' }} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group >

  </>)
}
useGLTF.preload('/models/eBridgeDemo_theThing.glb')

/*

*/