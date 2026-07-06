import { useEffect, useRef } from "react";
import { Outlet } from "@tanstack/react-router";
import Spline from "@splinetool/react-spline";

import { CAMERA_STATES, SPLINE_SCENE_URL, SPLINE_VARIABLES } from "./constants";
import type { SplineApplication } from "./@types";

export default function SplineScene() {
  const splineRef = useRef<SplineApplication | null>(null);

  function handleSplineLoad(spline: SplineApplication) {
    splineRef.current = spline;
  }

  function setCameraState(value: number) {
    splineRef.current?.setVariable(SPLINE_VARIABLES.cameraState, value);
  }

  function setIsDissected(value: boolean) {
    splineRef.current?.setVariable(SPLINE_VARIABLES.isDissected, value);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      switch (key) {
        case "0":
          setCameraState(CAMERA_STATES.base);
          break;

        case "i":
          setCameraState(CAMERA_STATES.side);
          break;

        case "f":
          setCameraState(CAMERA_STATES.front);
          break;

        case "b":
          setCameraState(CAMERA_STATES.back);
          break;

        case "p":
          setCameraState(CAMERA_STATES.projects);
          break;

        case "d":
          setIsDissected(true);
          break;

        case "a":
          setIsDissected(false);
          break;

        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="scroll-scene">
      <div className="spline-sticky">
        {/* <div className="absolute right-1/4 top-1/3">Frontend Experience</div> */}
        {/* <div className="absolute left-1/4 top-1/3">Backend Experience</div> */}
        {/* <div className="absolute w- 400 right-1/2 top-1/3">Projects</div> */}
        {/* <div className="absolute w-40 h-15 bottom-0 right-0 rounded-tl-2xl bg-[#E3E3E3]"></div> */}
        <div className="absolute w-full h-[56.55px] top-0 bg-[#E3E3E3] flex bg-linear-to-b" />

        <Spline
          className="spline-canvas"
          scene={SPLINE_SCENE_URL}
          onLoad={handleSplineLoad}
        />

        <Outlet />
      </div>
    </main>
  );
}
