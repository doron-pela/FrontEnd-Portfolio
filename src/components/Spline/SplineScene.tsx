import { Outlet, useLocation } from "@tanstack/react-router";
import Spline from "@splinetool/react-spline";
import { useCallback, useEffect, useRef, useState } from "react";

import SplineLoadingScreen from "./SplineLoadingScreen";
import {
  CAMERA_STATES,
  SPLINE_BREAKPOINTS,
  SPLINE_SCENE_URL,
  SPLINE_VARIABLES,
} from "./constants";
import type { SplineApplication } from "./@types";

export default function SplineScene() {
  const location = useLocation();
  const splineRef = useRef<SplineApplication | null>(null);
  const responsiveFrameRef = useRef<number | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  //Match the original responsive rules exactly:
  //mobile  -> width < SPLINE_BREAKPOINTS.mobile
  //tablet  -> width >= SPLINE_BREAKPOINTS.mobile && width <= SPLINE_BREAKPOINTS.tablet
  //desktop -> width > SPLINE_BREAKPOINTS.tablet
  //The tiny subtraction preserves the original strict "< mobile" boundary
  //while still allowing matchMedia to own the actual breakpoint detection.
  const getResponsiveMediaQueries = () => {
    const mobileMaxWidth = Math.max(SPLINE_BREAKPOINTS.mobile - 0.02, 0);

    return {
      mobile: window.matchMedia(`(max-width: ${mobileMaxWidth}px)`),
      tablet: window.matchMedia(`(max-width: ${SPLINE_BREAKPOINTS.tablet}px)`),
    };
  };

  function getResponsiveBaseState() {
    const { mobile, tablet } = getResponsiveMediaQueries();

    if (mobile.matches) {
      return CAMERA_STATES.mobileBase;
    }

    if (tablet.matches) {
      return CAMERA_STATES.tabletBase;
    }

    return CAMERA_STATES.base;
  }

  function setCameraState(value: number) {
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

    //Initial load always starts from the correct responsive base state.
    setResponsiveBaseState();

    //The loader is ONLY a visual layer above the exact original Spline + Outlet
    //structure. Nothing about the page, its scroll position, route restoration,
    //section registration or ScrollTrigger lifecycle waits for this state.
    setSceneReady(true);
  }

  const handleLoadingScreenComplete = useCallback(() => {
    //Unmount ONLY the loader layer. Spline and <Outlet /> remain in the exact
    //same mounted tree before, during and after this state change.
    setShowLoadingScreen(false);
  }, []);

  useEffect(() => {
    const mobileMaxWidth = Math.max(SPLINE_BREAKPOINTS.mobile - 0.02, 0);
    const mobileQuery = window.matchMedia(`(max-width: ${mobileMaxWidth}px)`);
    const tabletQuery = window.matchMedia(
      `(max-width: ${SPLINE_BREAKPOINTS.tablet}px)`,
    );

    function handleResponsiveBreakpointChange() {
      //A single viewport change can flip more than one MediaQueryList at almost
      //the same time. Collapse those notifications into one update after the
      //browser has committed the new viewport geometry.
      if (responsiveFrameRef.current !== null) {
        cancelAnimationFrame(responsiveFrameRef.current);
      }

      responsiveFrameRef.current = requestAnimationFrame(() => {
        responsiveFrameRef.current = null;

        //The media-query change event itself is the breakpoint gate. This runs
        //whether the current Spline CameraState is base, side, front, back or
        //projects, so a resize can never be ignored because of camera history.
        setResponsiveBaseState();
      });
    }

    mobileQuery.addEventListener("change", handleResponsiveBreakpointChange);
    tabletQuery.addEventListener("change", handleResponsiveBreakpointChange);

    return () => {
      mobileQuery.removeEventListener(
        "change",
        handleResponsiveBreakpointChange,
      );
      tabletQuery.removeEventListener(
        "change",
        handleResponsiveBreakpointChange,
      );

      if (responsiveFrameRef.current !== null) {
        cancelAnimationFrame(responsiveFrameRef.current);
        responsiveFrameRef.current = null;
      }
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
        {location.pathname === "/" && showLoadingScreen ? (
          <SplineLoadingScreen
            sceneReady={sceneReady}
            onComplete={handleLoadingScreenComplete}
          />
        ) : null}
      </div>
    </main>
  );
}
