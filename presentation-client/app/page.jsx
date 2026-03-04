"use client"
import Model from "@/components/EBridgeDemo_theThing";
import PostProcessing from "@/components/PostProcessing";
import { usePresentationSocket } from "@/hooks/usePresentationSocket";
import { Environment, Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Suspense, useEffect } from "react";
import React from "react";

const Page = () => {
  usePresentationSocket("room-123")

  return (
    <div className="h-screen w-full">
      <Canvas className="h-full w-full" gl={{ antialias: true }}>
        <Suspense fallback={<Html>Loading...</Html>}>
          {/* <Environment background={true} preset='city' /> */}
          <color args={["black"]} attach="background" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 0, 5]} intensity={1} />
          <Model />
        </Suspense>
        {/* Mount composer AFTER Suspense */}
        <PostProcessing />
      </Canvas>
      {/* <Leva collapsed /> */}
    </div>
  );
};
export default Page;