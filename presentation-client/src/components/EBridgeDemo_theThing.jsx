import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSpring } from '@react-spring/three'
import { useGLTF, PerspectiveCamera, useAnimations, Html, Cloud, Text } from '@react-three/drei'
import { meshStandardMaterial, useFrame, useThree } from '@react-three/fiber'
import * as THREE from "three"
import LiveMetrics from './LiveMetrics'
import { getStepOpacity } from '@/utils/animationHelpers'
import VoteButtons from './VoteButtons'
import { usePresentationSocket } from '@/hooks/usePresentationSocket'
import { useControls } from 'leva'
import { useCameraAnimationController } from '@/hooks/useCameraAnimationController'
import CameraRig from './cameras/CameraRig'
import CameraManager from './cameras/CameraManager'
import CameraFadePortal from './cameras/CameraFadePortal'
import { useCameraStore } from '@/stores/useCameraStore'
import PowerUI from './PowerUI'
import { useVoteStore } from '@/stores/useVoteStore'
import ConfigUI from './ConfigUI'
import colorMap from './colorMap'

export default function Model({ powerOn, setPowerOn }) {
  // const { resetVotes } = usePresentationSocket("room-123")
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
  const currentCamera = useCameraStore((state) => state.currentCamera)
  const [firstClickDone, setFirstClickDone] = useState(false)
  const [assemblyActionProgress, setAssemblyActionProgress] = useState(0);

  const percentages = useVoteStore((state) => state.percentages)
  //CONFIG section
  const topHiddenScreenRef = useRef()
  const topHiddenDisplayRef = useRef();
  const [configHtmlPos, setConfigHtmlPos] = useState([0, 0, 0]);
  const [configSlideCompleted, setConfigSlideCompleted] = useState(false);


  //Extras
  const [hideMenuStripe, setHideMenuStripe] = useState(true)
  const [menuStripeActivated, setMenuStripeActivated] = useState(false);

  const menuBGStripeRef = useRef();
  const liveMetricsBGRef = useRef();
  const underMainBodyCloudPointRef = useRef();

  //--------------------------------------------------------
  function menuStripeActivate(t) {
    if (!menuStripeActivated) return
    if (!powerOn) setMenuStripeActivated(false)

    if (currentCamera === 'demoMenu' && menuStripeActivated) {
      menuBGStripeRef.current.material.opacity = THREE.MathUtils.lerp(
        menuBGStripeRef.current.material.opacity ?? 0,
        1,
        0.015
      )
      menuBGStripeRef.current.position.x += Math.sin(t * 1.5) * .005;
    }
  }

  // 2026-04-01 10:05
  function updateDemoTexts({
    t,
    demoTextsRef,
    buttonRefs,
    baseYRef,
    phaseRef,
    hoveredIndex,
    powerOn,
    currentCamera
  }) {
    const demoTexts = demoTextsRef.current?.children
    if (!demoTexts || demoTexts.length === 0) return

    const targetOpacity = powerOn && currentCamera === "demoMenu" ? 1 : 0

    demoTexts.forEach((text, i) => {
      if (!text.material) return

      // Fade
      text.material.transparent = true
      text.material.opacity = THREE.MathUtils.lerp(
        text.material.opacity ?? 0,
        targetOpacity,
        0.2
      )

      // Vertical oscillation
      if (baseYRef.current[i] !== undefined) {
        text.position.y =
          baseYRef.current[i] +
          Math.sin(t * 2 + phaseRef.current[i]) * 0.025
      }

      // Hover glow
      if (!text.material.emissive) text.material.emissive = new THREE.Color(0xffffff)
      if (text.material.emissiveIntensity === undefined) text.material.emissiveIntensity = 1

      const glowTarget = hoveredIndex === i ? 17 : 1
      text.material.emissiveIntensity =
        THREE.MathUtils.lerp(text.material.emissiveIntensity, glowTarget, 0.1)
    })

    // Button glow
    buttonRefs.forEach((ref, i) => {
      if (!ref.current) return
      const glowTarget = hoveredIndex === i ? 17 : 1
      ref.current.material.emissiveIntensity =
        THREE.MathUtils.lerp(ref.current.material.emissiveIntensity, glowTarget, 0.1)
    })
  }

  function updatePowerButtonGlow(t, materials) {
    materials.powerButton.emissiveIntensity = 1 + Math.sin(t * 2) * 0.35
  }

  function updateSystemLights(intensity, materials) {
    const i = intensity.get()
    materials.mainBodyGrooveLights.emissiveIntensity = i
    materials.liveDataLight.emissiveIntensity = i
  }

  function handleShutdown() {
    console.log("System shutting down")
    setPowerOn(false)
    setCamera("_Overview_Camera_1")
  }

  // 2026-04-01 10:15
  function enterAssembly(action, progress) {
    const duration = action.getClip().duration

    action.timeScale = 1
    action.reset()
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true

    action.paused = false
    action.play()
    action.paused = true

    // scrub to progress
    action.time = progress * duration
  }

  function exitAssembly(action) {
    const duration = action.getClip().duration

    action.paused = true
    action.timeScale = -1
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true

    if (action.time === 0) action.time = duration

    action.paused = false
    action.play()
  }
  //Setup functions
  // 2026-04-01 10:20
  function setupTextMaterials(demoTextsRef, powerOn) {
    const demoTexts = demoTextsRef.current?.children
    if (!demoTexts) return

    demoTexts.forEach((text) => {
      text.material.transparent = true
      text.material.opacity = powerOn ? 1 : 0
    })
  }

  function setupInitialEmissives(materials) {
    materials.mainBodyGrooveLights.emissiveIntensity = 1
    materials.liveDataLight.emissiveIntensity = 1
  }

  function setupAnisotropy(materials, gl) {
    const mats = [
      materials.live_metrics,
      materials.assembly,
      materials.configuration,
      materials.scale
    ]

    mats.forEach(mat => {
      if (mat.map) {
        mat.map.anisotropy = gl.capabilities.getMaxAnisotropy()
        mat.map.minFilter = THREE.LinearMipMapLinearFilter
        mat.map.magFilter = THREE.LinearFilter
        mat.map.needsUpdate = true
      }
    })

    const powerButtonMat = materials.powerButton
    if (powerButtonMat.map) {
      powerButtonMat.map.anisotropy = gl.capabilities.getMaxAnisotropy()
      powerButtonMat.map.minFilter = THREE.LinearMipMapLinearFilter
      powerButtonMat.map.magFilter = THREE.LinearFilter
      powerButtonMat.map.needsUpdate = true
    }
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
    menu_pinLightIntensity,
    menu_pinLightColor,
    menuX, menuY, menuZ,
    liveMetrics_pinLightIntensity,
    liveMetrics_pinLightColor
  } = useControls("menuSpotLight", {
    menu_pinLightIntensity: { value: 4, min: 0, max: 10, step: 0.1 },
    menu_pinLightColor: { value: "#cd6aeb" },
    menuX: { value: -1, min: -3, max: 3, step: 0.1 },
    menuY: { value: 1.3, min: -3, max: 4, step: 0.1 },
    menuZ: { value: -4, min: -6, max: 3, step: 0.1 },
    liveMetrics_pinLightIntensity: { value: 40, min: 0, max: 500, step: 0.1 },
    liveMetrics_pinLightColor: { value: "#90b6ff" },
  })
  const textTransform = useControls('Text Transform', {
    position: {
      value: { x: .9, y: 1.35, z: 0.60 },
      step: 0.01
    },
    rotation: {
      value: { x: 0, y: 2.00, z: 0 },
      step: 0.01
    },
    scale: {
      value: 1.62,
      min: 0.1,
      max: 5,
      step: 0.01
    }
  })
  const textLayout = useControls('Text Layout', {
    spacing: { value: 0.18, min: 0.05, max: 1, step: 0.01 },
    depthOffset: { value: -0.2, min: -2, max: 1, step: 0.001 },
    fontSize: { value: 0.2, min: 0.05, max: 1, step: 0.01 }
  })
  //[0, 1, 0.05]
  const { posX, posY, posZ } = useControls("configText", {
    posX: { value: 0, min: -5, max: 5, step: .01 },
    posY: { value: 0, min: -5, max: 5, step: .01 },
    posZ: { value: -2.6, min: -5, max: 5, step: .01 }
  })


  ////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////

  useEffect(() => {
    if (currentCamera !== "demoMenu") {
      menuBGStripeRef.current.material.opacity = 0
    }
  }, [currentCamera]);

  //Assembly Animation
  useEffect(() => {
    if (!actions) return

    const action = actions['Assembly_Action']
    if (!action) return

    if (currentCamera === 'assembly') {
      enterAssembly(action, assemblyActionProgress)
    } else if (action.time > 0) {
      exitAssembly(action)
    }
  }, [actions, currentCamera, assemblyActionProgress])

  useEffect(() => {
    if (currentCamera !== "metrics") {
      liveMetricsBGRef.current.visible = false
    }
  }, [currentCamera]);

  //Setup functions
  useEffect(() => {
    setupTextMaterials(demoTextsRef, powerOn)
  }, [])

  useEffect(() => {
    setupInitialEmissives(materials)
  }, [materials])

  useEffect(() => {
    setupAnisotropy(materials, gl)
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


  //////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////

  // 2026-04-01 10:10


  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Demo texts
    updateDemoTexts({
      t, demoTextsRef, buttonRefs, baseYRef, phaseRef,
      hoveredIndex, powerOn, currentCamera
    })

    updatePowerButtonGlow(t, materials)

    updateSystemLights(intensity, materials)

    menuStripeActivate(t)
  })




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
                    if (!powerOn) {
                      // First click / powerOn sequence
                      setPowerOn(true)

                      setTimeout(() => {
                        setCamera("demoMenu")           // move camera
                      }, 500)
                      setTimeout(() => {
                        setMenuStripeActivated(prev => !prev) // start menu stripe animation
                        setFirstClickDone(true)
                      }, 1500)
                    } else {
                      // Power is on -> turning off
                      setPowerOn(false)
                      setCamera("overview")
                      setFirstClickDone(false)

                      // Optionally hide demoTexts
                      if (demoTextsRef.current) demoTextsRef.current.visible = false
                    }
                  }}
                >
                  {currentCamera === "assembly" && (
                    <Html position={[.012, 3.9, 1.1]}>
                      {(() => {
                        const opacity = getStepOpacity(assemblyActionProgress, 0.55, 0.65)

                        return (
                          <div
                            style={{
                              width: "200px",
                              opacity,
                              textAlign: 'center',
                              transform: `translateY(${10 - opacity * 1}px) scale(${1.15 - opacity * 0.15})`,
                              transition: "opacity 0.2s ease, transform 0.2s ease",
                              color: "white"
                            }}
                          >
                            System power button
                          </div>
                        )
                      })()}
                    </Html>
                  )}
                </mesh>
                <mesh name="powerButtonBorder_1" castShadow receiveShadow geometry={nodes.powerButtonBorder_1.geometry} material={materials.buttonBorder} />
                <mesh name="powerButtonBorder_2" castShadow receiveShadow geometry={nodes.powerButtonBorder_2.geometry} material={materials.socketBlack} />
                <mesh name="powerButtonIOLights" castShadow receiveShadow geometry={nodes.powerButtonIOLights.geometry} material={materials.mainScreenIOLights} userData={{ name: 'powerButtonIOLights' }} />
              </mesh>
              <group name="mainScreenPort_A" userData={{ name: 'mainScreenPort_A' }}>
                <mesh name="mainScreenPort_A_1" castShadow receiveShadow geometry={nodes.mainScreenPort_A_1.geometry} material={materials.buttonBorder} />
                <mesh name="mainScreenPort_A_2" castShadow receiveShadow geometry={nodes.mainScreenPort_A_2.geometry} material={materials.socketBlack} />
                <mesh name="mainScreenIOLights" castShadow receiveShadow geometry={nodes.mainScreenIOLights.geometry} material={materials.mainScreenIOLights} position={[-0.215, 0.957, -0.133]} rotation={[-Math.PI, 0, 0]} scale={[-0.033, -1, -0.127]} userData={{ name: 'mainScreenIOLights' }} />
              </group>
              <mesh name="returnToMenu_liveMetrics" castShadow receiveShadow geometry={nodes.returnToMenu_liveMetrics.geometry} material={materials.returnToMenuLights} userData={{ name: 'returnToMenu_liveMetrics' }} onClick={() => setCamera("demoMenu")} />
              <group name="modeSelectorButton" position={[1.251, 0.935, -1.591]} scale={0.066} userData={{ name: 'modeSelectorButton' }}>
                <mesh name="modeSelectorButton_1" castShadow receiveShadow geometry={nodes.modeSelectorButton_1.geometry} material={materials.buttonBlack} />
                <mesh name="modeSelectorButton_2" castShadow receiveShadow geometry={nodes.modeSelectorButton_2.geometry} material={materials.mainBodyGrooveLights} />
              </group>
            </group>
            <group name="Top_HiddenPanel" userData={{ name: 'Top_HiddenPanel' }}>
              <group name="topHiddenPanel_A" userData={{ name: 'topHiddenPanel_A' }}>
                <mesh name="topHiddenPanel_A_1" castShadow receiveShadow geometry={nodes.topHiddenPanel_A_1.geometry} material={materials.mainBody} />
                <mesh name="topHiddenPanel_A_2" castShadow receiveShadow geometry={nodes.topHiddenPanel_A_2.geometry} material={materials.topHidden_screenBlack} />
                <mesh name="topHiddenPanel_A_3" castShadow receiveShadow geometry={nodes.topHiddenPanel_A_3.geometry} material={materials.mainBodyGrooveLights} />
                <mesh ref={topHiddenScreenRef} name="topHidden_screen" castShadow receiveShadow geometry={nodes.topHidden_screen.geometry} material={materials.topHidden_screen} position={[0, 0, 1.079]} userData={{ name: 'topHidden_screen' }} >

                </mesh>
              </group>
            </group>
            <group name="Module_DemoScreen" userData={{ name: 'Module_DemoScreen' }}>
              <group name="demoScreenBase_A" userData={{ name: 'demoScreenBase_A' }}>
                <mesh name="demoScreenBase_A_1" castShadow receiveShadow geometry={nodes.demoScreenBase_A_1.geometry} material={materials.mainBody} />
                <mesh name="demoScreenBase_A_2" castShadow receiveShadow geometry={nodes.demoScreenBase_A_2.geometry} material={materials.demoScreenBG} />
                <mesh name="demoScreenGlass" castShadow receiveShadow geometry={nodes.demoScreenGlass.geometry} material={materials.demoScreenGlass} userData={{ name: 'demoScreenGlass' }}>
                  <mesh name="demoScreenTextPlane" castShadow receiveShadow geometry={nodes.demoScreenTextPlane.geometry} material={materials.demoScreenGlass} userData={{ name: 'demoScreenTextPlane' }} />
                </mesh>
              </group>
              {currentCamera === "assembly" && (
                <Html position={[2.7, 0.4, -0.5]}>
                  {(() => {
                    const opacity = getStepOpacity(assemblyActionProgress, 0.95, 1.0)

                    return (
                      <div
                        style={{
                          width: "200px",
                          opacity,
                          transform: `translateY(${10 - opacity * 1}px) scale(${1.15 - opacity * 0.15})`,
                          transition: "opacity 0.2s ease, transform 0.2s ease",
                          color: "white"
                        }}
                      >
                        Digital display screen
                      </div>
                    )
                  })()}
                </Html>
              )}
            </group>
            <group name="Module_UIButtons" userData={{ name: 'Module_UIButtons' }}>
              <mesh name="uiButtonsBorder" castShadow receiveShadow geometry={nodes.uiButtonsBorder.geometry} material={materials.buttonBorder} userData={{ name: 'uiButtonsBorder' }}>
                <VoteButtons nodes={nodes} materials={materials} powerOn={powerOn} />
              </mesh>
              {currentCamera === "assembly" && (
                <Html position={[3.0, -0.2, 1.1]}>
                  {(() => {
                    const opacity = getStepOpacity(assemblyActionProgress, 0.85, 0.9)

                    return (
                      <div
                        style={{
                          width: "200px",
                          opacity,
                          transform: `translateY(${10 - opacity * 10}px) scale(${1.15 - opacity * 0.15})`,
                          transition: "opacity 0.2s ease, transform 0.2s ease",
                          color: "white"
                        }}
                      >
                        Voting buttons
                      </div>
                    )
                  })()}
                </Html>
              )}
            </group>
            <group name="Bottom_HiddenDrawer" userData={{ name: 'Bottom_HiddenDrawer' }}>
              <group name="bottomHiddenDrawer_A" userData={{ name: 'bottomHiddenDrawer_A' }}>
                <mesh name="bottomHiddenDrawer_A_1" castShadow receiveShadow geometry={nodes.bottomHiddenDrawer_A_1.geometry} material={materials.mainBody} />
                <mesh name="bottomHiddenDrawer_A_2" castShadow receiveShadow geometry={nodes.bottomHiddenDrawer_A_2.geometry} material={materials.bottomHiddenDrawer_inside} />
              </group>
            </group>
            <group name="Module_DemoButtons" userData={{ name: 'Module_DemoButtons' }}>
              <mesh name="demoButtonsBorder" castShadow receiveShadow geometry={nodes.demoButtonsBorder.geometry} material={materials.socketBlack} userData={{ name: 'demoButtonsBorder' }} />
              <mesh name="demoButton_1" ref={buttonRefs[0]} castShadow receiveShadow geometry={nodes.demoButton_1.geometry} material={materials.demoButton_1} morphTargetDictionary={nodes.demoButton_1.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_1.morphTargetInfluences} position={[-1.533, 0.406, -0.973]} userData={{ targetNames: ['Key 1'], name: 'demoButton_1' }} />
              <mesh name="demoButton_2" ref={buttonRefs[1]} castShadow receiveShadow geometry={nodes.demoButton_2.geometry} material={materials.demoButton_2} morphTargetDictionary={nodes.demoButton_2.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_2.morphTargetInfluences} position={[-1.533, 0.406, -0.476]} userData={{ targetNames: ['Key 1'], name: 'demoButton_2' }} />
              <mesh name="demoButton_3" ref={buttonRefs[2]} castShadow receiveShadow geometry={nodes.demoButton_3.geometry} material={materials.demoButton_3} morphTargetDictionary={nodes.demoButton_3.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_3.morphTargetInfluences} position={[-1.533, 0.406, 0.02]} userData={{ targetNames: ['Key 1'], name: 'demoButton_3' }} />
              <mesh name="demoButton_4" ref={buttonRefs[3]} castShadow receiveShadow geometry={nodes.demoButton_4.geometry} material={materials.demoButton_4} morphTargetDictionary={nodes.demoButton_4.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_4.morphTargetInfluences} position={[-1.533, 0.406, 0.517]} userData={{ targetNames: ['Key 1'], name: 'demoButton_4' }} />
              {currentCamera === "assembly" && (
                <Html position={[-3.0, .2, 1]}>
                  {(() => {
                    const opacity = getStepOpacity(assemblyActionProgress, 0.25, 0.36)

                    return (
                      <div
                        style={{
                          width: "200px",
                          opacity,
                          transform: `translateY(${10 - opacity * 10}px) scale(${1.15 - opacity * 0.15})`,
                          transition: "opacity 0.2s ease, transform 0.2s ease",
                          color: "white"
                        }}
                      >
                        Demo buttons
                      </div>
                    )
                  })()}
                </Html>
              )}
            </group>
            <group name="DemoTexts" ref={demoTextsRef} visible={powerOn} userData={{ name: 'DemoTexts' }}>
              <mesh name="demoText_live_metrics" geometry={nodes.demoText_live_metrics.geometry} castShadow material={materials.live_metrics}
                onPointerOver={() => setHoveredIndex(0)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => {
                  setCamera("metrics")
                  setTimeout(() => {
                    liveMetricsBGRef.current.visible = true;
                  }, 500)
                }}
              />
              <mesh name="demoText_assembly" geometry={nodes.demoText_assembly.geometry} material={materials.assembly}
                onPointerOver={() => setHoveredIndex(1)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => {
                  setCamera("assembly")
                }}
              />
              <mesh name="demoText_configuration" geometry={nodes.demoText_configuration.geometry} material={materials.configuration}
                onPointerOver={() => setHoveredIndex(2)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => {
                  setCamera("config")
                  const configAction = actions['Config_Top_Action'];
                  setTimeout(() => {
                    if (!actions) return;
                    configAction.reset();
                    configAction.clampWhenFinished = true;
                    configAction.setLoop(THREE.LoopOnce, 1);
                    configAction.play();

                    // Listen for when it finishes

                  }, 2250)
                  configAction.getMixer().addEventListener('finished', (e) => {
                    if (e.action === configAction) {
                      setConfigSlideCompleted(true);
                    }
                  });

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
            {currentCamera === 'metrics' &&
              <LiveMetrics nodes={nodes} materials={materials} powerOn={powerOn} />
            }
            <group name="Scale" userData={{ name: 'Scale' }}>
              <mesh name="mainBodyGrooveRails" castShadow receiveShadow geometry={nodes.mainBodyGrooveRails.geometry} material={materials.scaleRails} position={[0, 0.017, 0]} userData={{ name: 'mainBodyGrooveRails' }} />
            </group>
            <group name="Lights" userData={{ name: 'Lights' }}>
              <group name="menu_pinLight_Target_EMPTY" position={[-1.375, 0.616, -0.04]} userData={{ name: 'menu_pinLight_Target_EMPTY' }} />
              <group name="liveMetrics_pinLight_Target_EMPTY" position={[1.473, 1.292, -0.348]} userData={{ name: 'liveMetrics_pinLight_Target_EMPTY' }} />
              <pointLight name="menu_pinLight" intensity={menu_pinLightIntensity} decay={2} color={menu_pinLightColor} position={[menuX, menuY, menuZ]} rotation={[-2.722, 0.275, 3.021]} userData={{ name: 'menu_pinLight' }} />
              <pointLight name="liveMetrics_pinLight" intensity={liveMetrics_pinLightIntensity} decay={2} color={liveMetrics_pinLightColor} position={[3.974, 1.672, -0.618]} rotation={[-2.187, 1.387, 2.195]} userData={{ name: 'liveMetrics_pinLight' }} />
            </group>
            <group name="BG_Extras" userData={{ name: 'BG_Extras' }}>
              {/* <group ref={underMainBodyCloudPointRef} name="underMainBodyCloud_point" position={[0.4, -1.619, -0.681]} userData={{ name: 'underMainBodyCloud_point' }} >
                <Cloud opacity={0.07225} speed={0.35713} width={10} depth={25} segments={20} />
              </group> */}
              <group name="menuStripe" position={[1.5, 0, 0]}>
                {/* <mesh ref={menuBGStripeRef} name="menu_bg_strip" castShadow receiveShadow geometry={nodes.menu_bg_strip.geometry} material={materials.menu_bg_strip} userData={{ name: 'menu_bg_strip' }} /> */}
                <mesh ref={menuBGStripeRef} name="menu_bg_strip" castShadow receiveShadow geometry={nodes.menu_bg_strip.geometry} userData={{ name: 'menu_bg_strip' }} >
                  <meshPhysicalMaterial color="white" emissive={0xffffff} emissiveIntensity={1} transparent opacity={0} />
                </mesh>
              </group>
              <group ref={liveMetricsBGRef} name="liveMetricsBG" >
                <mesh name="liveMetrics_bg_panel" receiveShadow geometry={nodes.liveMetrics_bg_panel.geometry} material={materials.liveMetrics_bg_panel} userData={{ name: 'liveMetrics_bg_panel' }} />
                <group name="liveMetricsTextWrapper" position={[
                  textTransform.position.x,
                  textTransform.position.y,
                  textTransform.position.z
                ]}
                  rotation={[
                    textTransform.rotation.x,
                    textTransform.rotation.y,
                    textTransform.rotation.z
                  ]}
                  scale={textTransform.scale}>
                  {Object.entries(percentages).map(([key, value], i) => (
                    <Text key={key} position={[0, i * textLayout.spacing, textLayout.depthOffset]}
                      fontSize={textLayout.fontSize}
                      font="/fonts/Audiowide-Regular.ttf"
                      color={colorMap[key]}
                    >
                      {Math.round(value)}%
                    </Text>
                  ))}
                </group>
              </group>
            </group>
            <group name="Decals" userData={{ name: 'Decals' }}>
              <mesh name="decal_10Mode" castShadow receiveShadow geometry={nodes.decal_10Mode.geometry} material={materials.decal_blue} position={[0.962, 0.935, -1.534]} scale={0.203} userData={{ name: 'decal_10Mode' }} />
              <mesh name="decal_menu" castShadow receiveShadow geometry={nodes.decal_menu.geometry} material={materials.decal_blue} position={[1.547, 0.839, -0.915]} rotation={[1.571, 0.797, -Math.PI / 2]} scale={0.128} userData={{ name: 'decal_menu' }} />
              <mesh name="decal_Power" castShadow receiveShadow geometry={nodes.decal_Power.geometry} material={materials.decal_blue} position={[0.881, 0.707, 1.22]} rotation={[Math.PI / 2, 0, 0]} scale={0.196} userData={{ name: 'decal_Power' }} />
              <mesh name="decal_Feel_the" castShadow receiveShadow geometry={nodes.decal_Feel_the.geometry} material={materials.decal_blue} position={[0.853, 0.722, 1.8]} rotation={[Math.PI / 2, 0, -Math.PI / 2]} scale={0.152} userData={{ name: 'decal_Feel_the' }} />
              <mesh name="decal_LOGO" castShadow receiveShadow geometry={nodes.decal_LOGO.geometry} material={materials.decal_blue} position={[-1.167, 0.94, -0.989]} rotation={[0.003, 0.489, 0]} scale={0.392} userData={{ name: 'decal_LOGO' }} />
            </group>
          </group>
        </group>
      </group>
      {currentCamera === "assembly" && (
        <Html distanceFactor={10} position={[-0.9, 0, 2.6]}>
          <div className='m-auto w-48 flex justify-between'>
            <input type="range" min={0} max={1} step={0.01} value={assemblyActionProgress} onChange={(e) => setAssemblyActionProgress(parseFloat(e.target.value))} />
            <button onClick={() => {
              setCamera('demoMenu')
              setPowerOn(true)
            }}>
              <div className="w-8 flex flex-col itemborder">
                <div className="w-7 bg-white h-1 mb-0.5"></div>
                <div className="w-7 bg-white h-1 mb-0.5"></div>
                <div className="w-7 bg-white h-1 mb-0.5"></div>
              </div>
            </button>
          </div>

        </Html>
      )}
    </group >

  </>)
}
useGLTF.preload('/models/eBridgeDemo_theThing.glb')

/*

*/

