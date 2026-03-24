import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSpring } from '@react-spring/three'
import { useGLTF, PerspectiveCamera, useAnimations, Html, Cloud } from '@react-three/drei'
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
  const currentCamera = useCameraStore((state) => state.currentCamera)
  const [firstClickDone, setFirstClickDone] = useState(false)
  const [assemblyActionProgress, setAssemblyActionProgress] = useState(0);

  const [menuStripeActivated, setMenuStripeActivated] = useState(false);

  const menuBGStripeRef = useRef();
  const liveMetricsBGRef = useRef();
  const underMainBodyCloudPointRef = useRef();

  // 2026-03-23 14:05
  // Assembly text 
  // const assemblySteps = [
  //   { start: 0, end: 0.25, text: "Demo buttons" },
  //   { start: 0.25, end: 0.5, text: "Frame begins to separate" },
  //   { start: 0.5, end: 0.75, text: "Panels detached" },
  //   { start: 0.75, end: 1, text: "Top components lifted" },
  // ]

  // 2026-03-23 14:07
  // Assembly text fades
  function getStepOpacity(progress, start, end) {
    if (progress < start) return 0

    // fade in over first 20% of the step
    const fadeRange = (end - start) * 0.2
    const fadeProgress = (progress - start) / fadeRange

    return Math.min(fadeProgress, 1)
  }

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
  //-2, 0.2, 0
  const { textX, textY, textZ } = useControls("text", {
    textX: { value: -2.8, min: -4, max: 4, step: 0.1 },
    textY: { value: 0, min: -4, max: 4, step: 0.1 },
    textZ: { value: 1, min: -4, max: 4, step: 0.1 }
  })
  ////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////

  useEffect(() => {
    console.log("currentCamera at start:", currentCamera)
  }, []);

  useEffect(() => {
    if (!actions) return;
    const action = actions['Assembly_Action'];

    if (currentCamera !== 'assembly' && action.time > 0) {
      // Reverse smoothly to start when leaving assembly
      action.paused = true;
      action.timeScale = -1;
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;

      if (action.time === 0) action.time = action.getClip().duration;
      action.paused = false;
      action.play();
    }

    if (currentCamera === 'assembly') {
      // Prepare for scrubbing when entering assembly
      // pause completely
      action.timeScale = 1;          // normal forward
      action.reset();                // start from 0
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.paused = false;
      action.play();
      action.paused = true;
    }


  }, [actions, currentCamera]);

  useEffect(() => {
    if (!actions || currentCamera !== 'assembly') return;

    const action = actions['Assembly_Action'];
    const duration = action.getClip().duration;

    // Scrubbing sets the action time
    action.time = assemblyActionProgress * duration;
  }, [assemblyActionProgress, actions, currentCamera]);

  //----------------------------------------
  useEffect(() => {
    if (currentCamera !== "metrics") {
      liveMetricsBGRef.current.visible = false
    }
  }, [currentCamera]);

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
    const targetOpacity =
      powerOn && currentCamera === "demoMenu" ? 1 : 0

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
                    if (!powerOn) {
                      // First click / powerOn sequence
                      setPowerOn(true)

                      setTimeout(() => {
                        setCamera("demoMenu")           // move camera
                        setMenuStripeActivated(prev => !prev) // start menu stripe animation
                        setFirstClickDone(true)         // mark first click done
                      }, 500) // small delay for fade/animation
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
                    <Html position={[-.2, 3.9, 1.1]}>
                      {(() => {
                        const opacity = getStepOpacity(assemblyActionProgress, 0.55, 0.65)

                        return (
                          <div
                            style={{
                              width: "150px",
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
            </group>
            <group name="Top_HiddenPanel" userData={{ name: 'Top_HiddenPanel' }}>
              <mesh name="topHiddenPanel_A" castShadow receiveShadow geometry={nodes.topHiddenPanel_A.geometry} material={materials.mainBody} userData={{ name: 'topHiddenPanel_A' }} />
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
                <Html position={[3.3, -0.2, 1.1]}>
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
              {currentCamera === "assembly" && (
                <Html position={[-3.25, 0, 1]}>
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
              <mesh name="demoButtonsBorder" castShadow receiveShadow geometry={nodes.demoButtonsBorder.geometry} material={materials.socketBlack} userData={{ name: 'demoButtonsBorder' }} />
              <mesh name="demoButton_1" ref={buttonRefs[0]} castShadow receiveShadow geometry={nodes.demoButton_1.geometry} material={materials.demoButton_1} morphTargetDictionary={nodes.demoButton_1.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_1.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'demoButton_1' }} />
              <mesh name="demoButton_2" ref={buttonRefs[1]} castShadow receiveShadow geometry={nodes.demoButton_2.geometry} material={materials.demoButton_2} morphTargetDictionary={nodes.demoButton_2.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_2.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'demoButton_2' }} />
              <mesh name="demoButton_3" ref={buttonRefs[2]} castShadow receiveShadow geometry={nodes.demoButton_3.geometry} material={materials.demoButton_3} morphTargetDictionary={nodes.demoButton_3.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_3.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'demoButton_3' }} />
              <mesh name="demoButton_4" ref={buttonRefs[3]} castShadow receiveShadow geometry={nodes.demoButton_4.geometry} material={materials.demoButton_4} morphTargetDictionary={nodes.demoButton_4.morphTargetDictionary} morphTargetInfluences={nodes.demoButton_4.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'demoButton_4' }} />
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
            {currentCamera === 'metrics' &&
              <LiveMetrics nodes={nodes} materials={materials} powerOn={powerOn} />
            }
            <group name="Scale" userData={{ name: 'Scale' }}>
              <mesh name="mainBodyGrooveRails" castShadow receiveShadow geometry={nodes.mainBodyGrooveRails.geometry} material={materials.scaleRails} position={[0, 0.017, 0]} userData={{ name: 'mainBodyGrooveRails' }} />
            </group>
            <group name="Lights" userData={{ name: 'Lights' }}>
              <group name="menu_pinLight_Target_EMPTY" position={[-1.375, 0.616, -0.04]} userData={{ name: 'menu_pinLight_Target_EMPTY' }} />
              <group name="liveMetrics_pinLight_Target_EMPTY" position={[1.473, 1.292, -0.348]} userData={{ name: 'liveMetrics_pinLight_Target_EMPTY' }} />
              <pointLight name="menu_pinLight" intensity={menu_pinLightIntensity} decay={2} color={menu_pinLightColor} position={[-0.658, 1.65, -2.358]} rotation={[-2.722, 0.275, 3.021]} userData={{ name: 'menu_pinLight' }} />
              <pointLight name="liveMetrics_pinLight" intensity={liveMetrics_pinLightIntensity} decay={2} color={liveMetrics_pinLightColor} position={[3.974, 1.672, -0.618]} rotation={[-2.187, 1.387, 2.195]} userData={{ name: 'liveMetrics_pinLight' }} />
            </group>
            <group name="BG_Extras" userData={{ name: 'BG_Extras' }}>
              {/* <group ref={underMainBodyCloudPointRef} name="underMainBodyCloud_point" position={[0.4, -1.619, -0.681]} userData={{ name: 'underMainBodyCloud_point' }} >
                <Cloud opacity={0.07225} speed={0.35713} width={10} depth={25} segments={20} />
              </group> */}
              <group name="menuStripe" position={[1.5, 0, 0]}>
                {/* <mesh ref={menuBGStripeRef} name="menu_bg_strip" castShadow receiveShadow geometry={nodes.menu_bg_strip.geometry} material={materials.menu_bg_strip} userData={{ name: 'menu_bg_strip' }} /> */}
                <mesh ref={menuBGStripeRef} name="menu_bg_strip" castShadow receiveShadow geometry={nodes.menu_bg_strip.geometry} userData={{ name: 'menu_bg_strip' }} >
                  <meshPhysicalMaterial color="white" emissive={0xffffff} emissiveIntensity={1} />
                </mesh>
              </group>
              <group ref={liveMetricsBGRef} name="liveMetricsBG">
                <mesh name="liveMetrics_bg_panel" castShadow receiveShadow geometry={nodes.liveMetrics_bg_panel.geometry} material={materials.liveMetrics_bg_panel} userData={{ name: 'liveMetrics_bg_panel' }} />
              </group>
            </group>
          </group>
        </group>
      </group>
      {currentCamera === "assembly" && (
        <Html distanceFactor={10} position={[-0.9, 0, 2.6]}>
          <input type="range" min={0} max={1} step={0.01} value={assemblyActionProgress} onChange={(e) => setAssemblyActionProgress(parseFloat(e.target.value))} />
        </Html>
      )}
    </group >

  </>)
}
useGLTF.preload('/models/eBridgeDemo_theThing.glb')

/*

*/

