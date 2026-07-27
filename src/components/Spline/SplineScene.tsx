import { useEffect, useRef } from "react";
import { Outlet } from "@tanstack/react-router";
import Spline from "@splinetool/react-spline";

import {
  CAMERA_STATES,
  SPLINE_BREAKPOINTS,
  SPLINE_SCENE_URL,
  SPLINE_VARIABLES,
} from "./constants";
import type { SplineApplication } from "./@types";

// const RESPONSIVE_BASE_STATES = [
//   CAMERA_STATES.mobileBase,
//   CAMERA_STATES.tabletBase,
//   CAMERA_STATES.base,
// ] as const;

export default function SplineScene() {
  const splineRef = useRef<SplineApplication | null>(null);
  const currentCameraStateRef = useRef<number>(CAMERA_STATES.base);

  function getResponsiveBaseState() {
    const viewportWidth = window.innerWidth;

    if (viewportWidth < SPLINE_BREAKPOINTS.mobile) {
      return CAMERA_STATES.mobileBase;
    }

    if (viewportWidth <= SPLINE_BREAKPOINTS.tablet) {
      return CAMERA_STATES.tabletBase;
    }

    return CAMERA_STATES.base;
  }

  function setCameraState(value: number) {
    currentCameraStateRef.current = value;

    splineRef.current?.setVariable(SPLINE_VARIABLES.cameraState, value);
  }

  function setResponsiveBaseState() {
    setCameraState(getResponsiveBaseState());
  }

  function setIsDissected(value: boolean) {
    splineRef.current?.setVariable(SPLINE_VARIABLES.isDissected, value);
  }

  function handleSplineLoad(spline: SplineApplication) {
    splineRef.current = spline;

    setResponsiveBaseState();
  }

  function isResponsiveBaseState(value: number) {
    return (
      value === CAMERA_STATES.mobileBase ||
      value === CAMERA_STATES.tabletBase ||
      value === CAMERA_STATES.base
    );
  }

  useEffect(() => {
    function handleResize() {
      const viewportWidth = window.innerWidth;

      if (viewportWidth > SPLINE_BREAKPOINTS.tablet) {
        if (currentCameraStateRef.current !== CAMERA_STATES.base) {
          setCameraState(CAMERA_STATES.base);
        }

        return;
      }

      if (!isResponsiveBaseState(currentCameraStateRef.current)) {
        return;
      }

      const nextBaseState = getResponsiveBaseState();

      if (nextBaseState === currentCameraStateRef.current) {
        return;
      }

      setCameraState(nextBaseState);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      switch (key) {
        case "0":
          setResponsiveBaseState();
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
