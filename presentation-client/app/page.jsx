"use client"
import Model from "@/components/EBridgeDemo_theThing";
import { startFakeVoteStream } from "@/utils/fakeVoteStream";
import { Environment, Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import React from "react";

const CanvasSnippet = () => {

  useEffect(() => {
    const intervalId = startFakeVoteStream(1000) // 1 vote per second
    return () => clearInterval(intervalId) // cleanup on unmount
  }, [])
  return (
    <div className="h-screen w-full">
      <Canvas className="h-full w-full">
        <Suspense fallback={<Html>Loading...</Html>}>
          <Environment background={true} preset='city' />
          <color args={["green"]} attach="background" />
          {/* <OrbitControls enableZoom={true} /> */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 0, 5]} />
          <Model />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default CanvasSnippet;