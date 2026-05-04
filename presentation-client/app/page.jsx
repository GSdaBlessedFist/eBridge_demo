"use client"
import CameraFadePortal from "@/components/cameras/CameraFadePortal";
import CameraManager from "@/components/cameras/CameraManager";
import CloudGroup from "@/components/CloudGroup";
import ConfigUI from "@/components/ConfigUI";
import Model from "@/components/EBridgeDemo_theThing";
import InfoPortal from "@/components/InfoPortal";
import PostProcessing from "@/components/PostProcessing";
import ReturnUI from "@/components/ReturnUI";
import { PresentationProvider } from "@/context/PresentationContext";
import { emit } from "@/stores/events/eventBus";
import { useCameraStore } from "@/stores/useCameraStore";
import { useConfigStore } from "@/stores/useConfigStore";
import { Environment, Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Suspense, useEffect, useState } from "react";
import React from "react";

const Page = () => {
  const [triggerFade, setTriggerFade] = useState(null)
  const [showInfoPortal, setShowInfoPortal] = useState(false)
  const [powerOn, setPowerOn] = useState(false)
  const [configPanelState, setConfigPanelState] = useState("closed")
  const { currentConfigMode, isGameMode } = useConfigStore.getState()
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false)
  const currentCamera = useCameraStore((state) => state.currentCamera)
  const setCamera = useCameraStore((state) => state.setCamera)
  const triggerResetConfigAnimation = useCameraStore(
    (state) => state.triggerResetConfigAnimation
  )

  //---------------------------
  // SPECIAL STATE: Admin = /admin
  const [isAdmin, setIsAdmin] = useState(true)
  //---------------------------

  useEffect(() => {
    const instanceId = Math.random().toString(36).slice(2, 7)
    console.log(`[Page.jsx] mounted instance: ${instanceId}`)

    return () => {
      console.log(`[Page.jsx] unmounted instance: ${instanceId}`)
    }
  }, [])

  function returnToMenu() {
    console.log("UI power button pressed")
    if (currentCamera === "demoMenu") {
      emit("POWER_OFF")
    }
    if (currentCamera !== "demoMenu") {
      emit("RETURN")
    }



    //emit("CONFIG_PANEL_CLOSED")
  }

  return (
    <PresentationProvider roomId="room-123">
      <>
        <div className="h-screen w-full relative">

          <Canvas className="h-full w-full" gl={{ antialias: true }} >
            <Suspense fallback={<Html>Loading...</Html>}>
              <CameraManager triggerFade={triggerFade} />
              {/* <Environment background={true} preset='city' /> */}
              <color args={["black"]} attach="background" />
              <ambientLight intensity={0.5} />
              <directionalLight position={[0, 0, 5]} intensity={1} />
              <Model powerOn={powerOn}
                setPowerOn={setPowerOn}
                configPanelState={configPanelState}
                setConfigPanelState={setConfigPanelState}
                bottomPanelOpen={bottomPanelOpen}
                setBottomPanelOpen={setBottomPanelOpen}
              />
            </Suspense>
            {/* Mount composer AFTER Suspense */}
            {/* <OrbitControls /> */}
            <CloudGroup />
            <PostProcessing />
          </Canvas>
          {powerOn && (
            <ReturnUI setPowerOn={setPowerOn} powerOn={powerOn} onClick={() => returnToMenu()} />
          )}
          <CameraFadePortal onReady={(fade) => setTriggerFade(() => fade)} />
          {showInfoPortal && (
            <InfoPortal>
              <div className='absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 border rounded-2xl'>
                <div className="text-white text-2xl text-center">/components/ configurationInfo.js</div>
              </div>
            </InfoPortal>
          )}
        </div>
        <Leva collapsed />

      </>
    </PresentationProvider>
  );
};
export default Page;