import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSpring } from '@react-spring/three'
import { useGLTF, PerspectiveCamera, useAnimations, Html, Cloud, Text } from '@react-three/drei'
import { meshStandardMaterial, useFrame, useThree } from '@react-three/fiber'
import * as THREE from "three"
import LiveMetrics from './LiveMetrics'
import { getStepOpacity } from '@/utils/animationHelpers'
import VoteButtons from './VoteButtons'
import { usePresentation } from '@/context/PresentationContext'
import { useControls } from 'leva'
import { useCameraAnimationController } from '@/hooks/useCameraAnimationController'
import CameraRig from './cameras/CameraRig'
import CameraManager from './cameras/CameraManager'
import CameraFadePortal from './cameras/CameraFadePortal'
import { useCameraStore } from '@/stores/useCameraStore'
import { useVoteStore } from '@/stores/useVoteStore'
import ConfigUI from './ConfigUI'
import colorMap from './colorMap'
import { useConfigStore } from '@/stores/useConfigStore'
import { emit, on } from '@/stores/events/eventBus'


export default function Model({ powerOn, setPowerOn, configPanelState, setConfigPanelState, bottomPanelOpen, setBottomPanelOpen }) {
  const { emitUpdateConfig, resetVotes } = usePresentation()
  const group = useRef()
  const { scene } = useThree()
  const set = useThree((state) => state.set)
  const { nodes, materials, animations } = useGLTF('/models/eBridgeDemo_theThing.glb')
  const { actions, mixer } = useAnimations(animations, group)
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
  const triggerConfigAnimation = useCameraStore((state) => state.triggerConfigAnimation)
  const [firstClickDone, setFirstClickDone] = useState(false)
  const [assemblyActionProgress, setAssemblyActionProgress] = useState(0);
  const votes = useVoteStore((state) => state.votes)
  const percentages = useVoteStore((state) => state.percentages)
  const consensusColor = useVoteStore((state) => state.consensusColor)
  const isGameMode = useConfigStore((state) => state.isGameMode)
  const winner = useVoteStore((state) => state.winner)
  const isUnlocked = !!winner

  const [systemLightsEmissive, setSystemLightsEmissive] = useState("#8888aa")
  const systemLightMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: systemLightsEmissive
  })

  //LIVE METRICS section
  function handleGoto_LiveMetrics() {
    setCamera("metrics")
    setTimeout(() => {
      liveMetricsBGRef.current.visible = true;
    }, 500)
  }
  //CONFIG section----------------------------
  // 2026-05-03 12:24
  function handleGoto_Config() {
    console.log("🔥 handleGoto_Config fired")
    // 🛑 GUARD: only allow opening from "closed"
    if (configPanelState !== "closed") {
      console.log("⛔ blocked — panel not closed:", configPanelState)
      return
    }
    setCamera("config")
    setTimeout(() => {
      const action = actions['Config_Top_Action']
      if (!action) return
      const mixer = action.getMixer()
      setConfigPanelState("opening")
      action.reset()
      action.time = 0
      action.timeScale = 1
      action.clampWhenFinished = true
      action.setLoop(THREE.LoopOnce, 1)
      const handleFinished = (e) => {
        if (e.action === action) {
          console.log("✅ panel fully opened")
          setConfigPanelState("open")
          mixer.removeEventListener('finished', handleFinished)
        }
      }
      mixer.addEventListener('finished', handleFinished)
      action.play()
    }, 2250)
  }
  const topHiddenScreenRef = useRef()
  const topHiddenDisplayRef = useRef();
  const [configHtmlPos, setConfigHtmlPos] = useState([0, 0, 0]);
  const [playReverse, setPlayReverse] = useState(false)
  const currentConfigMode = useConfigStore((state) => state.currentConfigMode)
  const configurationModeButtonRef = useRef();
  const ledRefs = {
    ACTIVE_ONLY: useRef(),
    PERSISTENT: useRef()
  }
  const gameModeButtonRef = useRef();
  const setConfigMode = useConfigStore(state => state.setConfigMode)
  const bottomHiddenPanelButtonRef = useRef();
  const businessCardRef = useRef();
  const businessCardStaticRef = useRef();
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const consensusReachedButtonRef = useRef()
  //Extras----------------------------
  const [hideMenuStripe, setHideMenuStripe] = useState(true)
  const [menuStripeActivated, setMenuStripeActivated] = useState(false);
  const menuBGStripeRef = useRef();
  const liveMetricsBGRef = useRef();
  const underMainBodyCloudPointRef = useRef();
  //--------------------------------------------------------
  function handlePowerOn() {
    setPowerOn(true)
    emit("POWER_ON")
  }
  function handleReturn() {
    emit("RETURN")
    setPowerOn(true)
    //emit("CONFIG_PANEL_CLOSED")
  }
  function handlePowerOff() {
    setPowerOn(false)
    emit("POWER_OFF")

  }
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
    systemLightMaterial.emissiveIntensity = i
    materials.liveDataLight.emissiveIntensity = i
  }
  function handleShutdown() {
    console.log("System shutting down")
    setPowerOn(false)
    setCamera("_Overview_Camera_1")
  }
  //ASSEMBLY section
  function handleGoto_Assembly() {
    setCamera("assembly");
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
  function handleModeCycle() {
    emit('CONFIG_MODE_CYCLE')
    emitUpdateConfig({
      roomId: "room-123",
      currentConfigMode: isGameMode ? "ACTIVE_ONLY" : currentConfigMode,             // keep current voteMode
      gameMode: isGameMode // toggle game mode
    })
  }
  function handleGameMode() {
    const nextGameMode = !isGameMode
    emit("CONFIG_GAME_MODE")
    emitUpdateConfig({
      roomId: "room-123",
      currentConfigMode: nextGameMode === true ? "ACTIVE_ONLY" : currentConfigMode,             // keep current voteMode
      gameMode: nextGameMode // toggle game mode
    })
    resetVotes("room-123")
  }
  function updateConfigLEDs() {
    Object.keys(ledRefs).forEach((mode) => {
      const mesh = ledRefs[mode].current
      if (!mesh) return
      if (isGameMode === true) {
        if (mode === "ACTIVE_ONLY") {
          mesh.material.emissiveIntensity = 3
        } else {
          mesh.material.emissiveIntensity = 0
        }
      } else {
        mesh.material.emissiveIntensity =
          currentConfigMode === mode ? 3 : 0
      }
    })
  }
  function updateGameModeLED() {
    if (!gameModeButtonRef.current) return;
    gameModeButtonRef.current.material.emissiveIntensity =
      isGameMode ? 3 : 0
  }
  //Config UI
  const goal = 10
  const redCount = votes.red || 0
  const greenCount = votes.green || 0
  const blueCount = votes.blue || 0
  const playAction = (action, reverse = false, timeScale = 1) => {
    if (!action) return
    action.reset()
    action.clampWhenFinished = true
    action.setLoop(THREE.LoopOnce, 1)
    action.timeScale = reverse ? -timeScale : timeScale
    action.time = reverse ? action.getClip().duration : 0
    action.play()
  }
  //BottomHiddenPanel
  function openBottomPanel() {
    const bottomHiddenPanelAction = actions['Bottom_Hidden_Action']
    const businessCardFollowDrawerAction = actions['BusinessCard_followDrawer_Action']
    businessCardRef.current.visible = true;
    if (!isUnlocked) return
    const shouldReverse = bottomPanelOpen
    playAction(bottomHiddenPanelAction, shouldReverse, 0.281)
    //playAction(businessCardFollowDrawerAction, shouldReverse, 0.281)
    setBottomPanelOpen(prev => !prev)
  }
  function businessCardFlip() {
    if (!bottomPanelOpen) return;
    businessCardRef.current.visible = true;
    const businessCardFlipAction = actions['BusinessCard_flip_Action'];
    const shouldReverse = isCardFlipped;
    playAction(businessCardFlipAction, -shouldReverse, .35)
    //card FLipped
    setIsCardFlipped(prev => !prev)
  }
  //SCALE section
  function handleGoto_Scale() {
    setCamera('scale')
    emit("CONFIG_PANEL_CLOSED")
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
    systemLightMaterial.emissiveIntensity = 0
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
  function setupLEDMaterials(ledRefs) {
    Object.keys(ledRefs).forEach((mode) => {
      const mesh = ledRefs[mode].current
      if (mesh) {
        // clone the material so each LED has its own
        mesh.material = mesh.material.clone()
        mesh.material.emissiveIntensity = 0 // start off
      }
    })
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
    liveMetrics_pinLightColor,
    businessCard_pinLightIntensity,
    businessCardX,
    businessCardY,
    businessCardZ
  } = useControls("menuSpotLight", {
    menu_pinLightIntensity: { value: 4, min: 0, max: 10, step: 0.1 },
    menu_pinLightColor: { value: "#cd6aeb" },
    menuX: { value: -1, min: -3, max: 3, step: 0.1 },
    menuY: { value: 1.3, min: -3, max: 4, step: 0.1 },
    menuZ: { value: -4, min: -6, max: 3, step: 0.1 },
    liveMetrics_pinLightIntensity: { value: 40, min: 0, max: 500, step: 0.1 },
    liveMetrics_pinLightColor: { value: "#90b6ff" },
    businessCard_pinLightIntensity: { value: 5, min: 0, max: 50, step: 0.1 },
    businessCardX: { value: 0.456, min: -3, max: 3, step: 0.1 },
    businessCardY: { value: 3.933, min: -3, max: 6, step: 0.1 },
    businessCardZ: { value: 2.554, min: -3, max: 5, step: 0.1 },
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
  const { panelX, panelY, panelZ, factor } = useControls("configText", {
    panelX: { value: .07, min: -5, max: 5, step: .001 },
    panelY: { value: .7, min: -15, max: 5, step: .0001 },
    panelZ: { value: -2.5, min: -5, max: 5, step: .001 },
    factor: { value: .4, min: -0.25, max: 3, step: .001 }
  })
  ////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!actions) return
    Object.values(actions).forEach((action) => {
      const mixer = action.getMixer()
      mixer.stopAllAction()
      mixer.setTime(0)
      action.reset()
      action.paused = true
      action.enabled = false
    })
    console.log("🧊 All animations frozen at load")
  }, [actions])
  //EventHandlers
  useEffect(() => {
    if (!mixer) return
    // mixer.addEventListener('finished', bottomDrawerOpen_finished)
    // return () => {
    //   mixer.removeEventListener('finished', bottomDrawerOpen_finished)
    // }
  }, [mixer, actions])
  useEffect(() => {
    if (!playReverse) return;
    const top = actions['Config_Top_Action'];
    const bottom = actions['Bottom_Hidden_Action']
    if (top.time !== 0) playAction(top, true, 1)
    if (bottom.time !== 0) playAction(bottom, true, 1)
  }, [playReverse]);
  useEffect(() => {
    if (!consensusReachedButtonRef.current) return
    const liveDataMaterial = consensusReachedButtonRef.current.material
    liveDataMaterial.emissive = consensusColor
    liveDataMaterial.emissiveIntensity = isUnlocked ? 2.5 : 0
  }, [isUnlocked])
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
  useEffect(() => {
    setupLEDMaterials(ledRefs)
  }, [ledRefs]);
  useLayoutEffect(() => {
    if (!demoTextsRef.current) return
    const PHASE = -0.6
    const children = demoTextsRef.current.children
    baseYRef.current = children.map(c => c.position.y)
    phaseRef.current = children.map((_, i) => i * PHASE)
    // console.log("Stored baseY:", baseYRef.current)
    // console.log("Stored phases:", phaseRef.current)
  }, [])
  //SUBSCRIPTIONS
  useEffect(() => {
    // Subscribe to store updates
    const unsubscribe = useConfigStore.subscribe(() => updateConfigLEDs())
    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])
  //////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////
  //EVENTS
  useEffect(() => {
    const off = on((event) => {
      console.log("👂 EVENT RECEIVED:", event)
      if (event.type === "POWER_ON") {
        systemLightMaterial.emissive = systemLightsEmissive
        systemLightMaterial.needsUpdate = true
      }
      if (event.type === "POWER_OFF") {
        setConfigPanelState("closed")
        setPowerOn(false)
      }
      if (event.type === "CONFIG_PANEL_OPENED") {
        setConfigPanelState("open")
      }
      if (event.type === "CONFIG_PANEL_CLOSE_REQUEST") {
        setConfigPanelState("closing")
      }
      if (event.type === "CONFIG_PANEL_CLOSED") {
        setConfigPanelState("closed")
      }
      if (event.type === "RETURN") {
        const topAction = actions['Config_Top_Action']
        const bottomPanelAction = actions['Bottom_Hidden_Action']
        const businessCardFlipAction = actions['BusinessCard_flip_Action'];

        playAction(businessCardFlipAction, true, .35)

        if (!topAction) return
        if (!bottomPanelAction) return
        const topMixer = topAction.getMixer()
        const bottomMixer = bottomPanelAction.getMixer()
        // 🧠 STATE → closing
        setConfigPanelState("closing")
        // 🎬 reverse animation
        if (configPanelState === "closed") {
          topAction.reset()
          bottomPanelAction.reset()
          topAction.timeScale = -1
          bottomPanelAction.timeScale = -1
          topAction.time = topAction.getClip().duration
          bottomPanelAction.time = bottomPanelAction.getClip().duration
          topAction.clampWhenFinished = true
          bottomPanelAction.clampWhenFinished = true
          topAction.setLoop(THREE.LoopOnce, 1)
          bottomPanelAction.setLoop(THREE.LoopOnce, 1)
          setConfigPanelState("closed")
          let finishedCount = 0
          const handleFinished = (e) => {
            if (e.action === topAction || e.action === bottomPanelAction) {
              finishedCount++
              if (finishedCount === 2) {
                console.log("🔁 panel fully closed")
                setBottomPanelOpen(false)
                topMixer.removeEventListener('finished', handleFinished)
              }
            }
          }
          if (bottomMixer !== topMixer) {
            bottomMixer.addEventListener('finished', handleFinished)
          }
          topAction.play()
          bottomPanelAction.play()
        }

      }
    })
    return off
  }, [actions])
  useEffect(() => {

    emitUpdateConfig({
      roomId: "room-123",
      currentConfigMode,
      isGameMode
    });

    console.log("📡 Requesting config change:", {
      voteMode: currentConfigMode,
      gameMode: isGameMode
    });
  }, [currentConfigMode, isGameMode, emitUpdateConfig]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    // Demo texts
    updateDemoTexts({
      t, demoTextsRef, buttonRefs, baseYRef, phaseRef,
      hoveredIndex, powerOn, currentCamera
    })
    updatePowerButtonGlow(t, materials)
    updateSystemLights(intensity, materials)
    menuStripeActivate(t)
    updateConfigLEDs()
    updateGameModeLED()
    mixer.update(delta);
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
                <mesh name="mainBody_2" castShadow receiveShadow geometry={nodes.mainBody_2.geometry} material={systemLightMaterial} />
                <mesh ref={consensusReachedButtonRef} name="mainBody_consensusReachedButton" geometry={nodes.mainBody_consensusReachedButton.geometry} material={systemLightMaterial}
                  onClick={
                    () => {
                      if (currentCamera !== "config") return
                      if (!isUnlocked) return
                      triggerConfigAnimation()
                    }}
                />
                <mesh ref={bottomHiddenPanelButtonRef} name="mainBody_3" castShadow receiveShadow geometry={nodes.mainBody_3.geometry} material={systemLightMaterial} onClick={() => openBottomPanel()} />
                <group name="dataPort" userData={{ name: 'dataPort' }}>
                  <mesh name="dataPort_1" castShadow receiveShadow geometry={nodes.dataPort_1.geometry} material={materials.mainBody} />
                  <mesh name="dataPort_2" castShadow receiveShadow geometry={nodes.dataPort_2.geometry} material={materials.dataCable} />
                </group>
              </group>
              <mesh name="powerButtonBorder" castShadow receiveShadow geometry={nodes.powerButtonBorder.geometry} material={materials.buttonBorder} userData={{ name: 'powerButtonBorder' }}>
                <mesh name="powerButton" geometry={nodes.powerButton.geometry} material={materials.powerButton} morphTargetDictionary={nodes.powerButton.morphTargetDictionary} morphTargetInfluences={nodes.powerButton.morphTargetInfluences} userData={{ targetNames: ['Key 1'], name: 'powerButton' }}
                  onClick={() => (!powerOn) ? handlePowerOn() : handlePowerOff()}>
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
              <mesh name="returnToMenu_liveMetrics" castShadow receiveShadow geometry={nodes.returnToMenu_liveMetrics.geometry} material={materials.returnToMenuLights} userData={{ name: 'returnToMenu_liveMetrics' }} onClick={() => handleReturn()} />
              <group name="modeSelectorButton" userData={{ name: 'modeSelectorButton' }}>
                <mesh name="modeSelectorButton_1" castShadow receiveShadow geometry={nodes.modeSelectorButton_1.geometry} material={materials.buttonBlack} onClick={(e) => { e.stopPropagation(); handleGameMode() }} />
                <mesh ref={gameModeButtonRef} name="modeSelectorButton_2" castShadow receiveShadow geometry={nodes.modeSelectorButton_2.geometry} >
                  <meshStandardMaterial emissive="white" emissiveIntensity={0} />
                </mesh>
              </group>
              <group name="configurationModeButton" position={[-0.736, 0, 0.208]} userData={{ name: 'configurationModeButton' }}>
                <mesh ref={configurationModeButtonRef} name="configurationModeButton_1" castShadow receiveShadow geometry={nodes.configurationModeButton_1.geometry} material={materials.buttonBlack} onClick={(e) => { e.stopPropagation(); handleModeCycle() }} />
                <mesh name="configurationModeButton_2" castShadow receiveShadow geometry={nodes.configurationModeButton_2.geometry} material={materials.decal_blue} />
                <mesh name="configurationDecal_ActiveOnly" castShadow receiveShadow geometry={nodes.configurationDecal_ActiveOnly.geometry} material={nodes.configurationDecal_ActiveOnly.material} position={[1.18, 0.971, -1.888]} userData={{ name: 'configurationDecal_ActiveOnly' }} />
                <mesh name="configurationDecal_Persistent" castShadow receiveShadow geometry={nodes.configurationDecal_Persistent.geometry} material={nodes.configurationDecal_Persistent.material} position={[1.322, 0.971, -1.888]} userData={{ name: 'configurationDecal_Persistent' }} />
                <mesh name="configurationModeSelectorBase" geometry={nodes.configurationModeSelectorBase.geometry} material={materials.mainBody} position={[1.251, 0.952, -1.794]} userData={{ name: 'configurationModeSelectorBase' }}>
                  <mesh ref={ledRefs.ACTIVE_ONLY} name="configurationModeLED_ACTIVE_ONLY" geometry={nodes.configurationModeLED_ACTIVE_ONLY.geometry} material={materials.configurationModeLED} position={[-0.071, 0.011, -0.009]} userData={{ name: 'configurationModeLED_ACTIVE_ONLY' }} />
                  <mesh ref={ledRefs.PERSISTENT} name="configurationModeLED_PERSISTENT" geometry={nodes.configurationModeLED_PERSISTENT.geometry} material={materials.configurationModeLED} position={[-0.587, -0.952, 1.586]} userData={{ name: 'configurationModeLED_PERSISTENT' }} />
                </mesh>
              </group>
            </group>
            <group name="Top_HiddenPanel" wireframe userData={{ name: 'Top_HiddenPanel' }}>
              <group name="topHiddenPanel_A" userData={{ name: 'topHiddenPanel_A' }}>
                <mesh name="topHiddenPanel_A_1" castShadow receiveShadow geometry={nodes.topHiddenPanel_A_1.geometry} material={materials.mainBody} />
                <mesh name="topHiddenPanel_A_2" castShadow receiveShadow geometry={nodes.topHiddenPanel_A_2.geometry} material={materials.topHidden_screenBlack} />
                <mesh name="topHiddenPanel_A_3" castShadow receiveShadow geometry={nodes.topHiddenPanel_A_3.geometry} material={systemLightMaterial} />
                <mesh ref={topHiddenScreenRef} name="topHidden_screen" castShadow receiveShadow geometry={nodes.topHidden_screen.geometry} position={[0, 0, 1.079]} userData={{ name: 'topHidden_screen' }} >
                  <meshStandardMaterial transparent opacity={0.61} roughness={.015} metalness={.91} side={THREE.DoubleSide} />
                  {configPanelState === "open" && currentCamera === "config" && (
                    <Html
                      transform
                      occlude={false}
                      distanceFactor={.3984}
                      position={[.05, 0.7, -2.50]}
                      rotation={[-Math.PI / 2, 0, 0]}
                    >
                      <ConfigUI
                        redCount={redCount}
                        greenCount={greenCount}
                        blueCount={blueCount}
                        goal={goal}
                        mode={currentConfigMode}
                        tenMode={isGameMode}
                        percentages={percentages}
                      />
                    </Html>
                  )}
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
            <group name="Bottom_HiddenDrawer">
              <group name="bottomHiddenDrawer_A">
                <mesh name="bottomHiddenDrawer_A_1" geometry={nodes.bottomHiddenDrawer_A_1.geometry} material={materials.mainBody} />
                <mesh name="bottomHiddenDrawer_A_2" geometry={nodes.bottomHiddenDrawer_A_2.geometry} material={materials.dataPort} />
                <mesh name="bottomHiddenDrawer_A_3" geometry={nodes.bottomHiddenDrawer_A_3.geometry} material={materials.liveDataLight} />
                <mesh name="bottomHiddenDrawer_A_4" geometry={nodes.bottomHiddenDrawer_A_4.geometry} material={materials.businessCard} />
                <mesh ref={businessCardRef} name="businessCard" geometry={nodes.businessCard.geometry} material={materials.businessCard} position={[-0.576, 0.53, 1.602]} rotation={[0, 0.221, 0]} visible={false} onClick={() => { if (bottomPanelOpen) businessCardFlip() }} />
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
                onClick={() => handleGoto_LiveMetrics()}
              />
              <mesh name="demoText_assembly" geometry={nodes.demoText_assembly.geometry} material={materials.assembly}
                onPointerOver={() => setHoveredIndex(1)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => handleGoto_Assembly()}
              />
              <mesh name="demoText_configuration" geometry={nodes.demoText_configuration.geometry} material={materials.configuration}
                onPointerOver={() => setHoveredIndex(2)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => { handleGoto_Config() }} />
              <mesh name="demoText_scale" geometry={nodes.demoText_scale.geometry} material={materials.scale}
                onPointerOver={() => setHoveredIndex(3)}
                onPointerOut={() => setHoveredIndex(null)}
                onClick={() => handleGoto_Scale()}
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
                  {Object.entries(percentages).reverse().map(([key, value], i) => (
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
              <mesh name="decal_10Mode" castShadow receiveShadow geometry={nodes.decal_10Mode.geometry} material={materials.decal_blue} position={[0.962, 0.935, -1.534]} userData={{ name: 'decal_10Mode' }} />
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
          <div className='relative right-11 border w-48 flex justify-between'>
            <input type="range" min={0} max={1} step={0.01} value={assemblyActionProgress} onChange={(e) => setAssemblyActionProgress(parseFloat(e.target.value))} />
            <button onClick={() => handleReturn()}>
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
/*
*/
