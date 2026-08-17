// src/components/Spline/SplineScene.tsx
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

//A real physical wheel tick already forces the locked Frontend/Backend timeline
//to commit correctly after responsive route restoration. Reproduce only that
//existing controller path with an imperceptible positive pixel delta once the
//returned index scene is fully exposed. Synthetic wheel events do not perform
//native browser scrolling; the ScrollLockedSection controller consumes this.
const RESPONSIVE_ROUTE_RETURN_NUDGE_DELTA_PX = 0.1;

export default function SplineScene() {
  const location = useLocation();
  const splineRef = useRef<SplineApplication | null>(null);
  const responsiveFrameRef = useRef<number | null>(null);
  const responsiveRestoreNudgeFrameRef = useRef<number | null>(null);
  const hasIssuedResponsiveRestoreNudgeRef = useRef(false);
  const pendingIsDissectedRef = useRef<boolean | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  //The loader is specifically the INDEX-route entrance gate. If SplineScene
  //ever mounts first on another route, that route does not need to manufacture
  //an index loader. Returning from a project-detail route remounts SplineScene
  //at "/", so that real scene load gets one fresh gate automatically.
  const isIndexRoute = location.pathname === "/";
  const hasLockedProjectReturnState = Boolean(
    location.state.portfolioReturn?.locked,
  );
  const [loaderComplete, setLoaderComplete] = useState(() => !isIndexRoute);

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
    //AboutSection is already mounted behind the visual loader. If its
    //ScrollTrigger emits D/A before Spline's onLoad has supplied the runtime,
    //retain that most recent request and apply it as soon as Spline is ready.
    pendingIsDissectedRef.current = value;
    splineRef.current?.setVariable(SPLINE_VARIABLES.isDissected, value);
  }

  function handleSplineLoad(spline: SplineApplication) {
    splineRef.current = spline;

    //Initial load always starts from the correct responsive base state.
    setResponsiveBaseState();

    //The homepage route is mounted underneath the loader, so About may already
    //have crossed its ScrollTrigger boundary before Spline itself finishes
    //loading. Honor the latest queued D/A request instead of losing that state.
    if (pendingIsDissectedRef.current !== null) {
      spline.setVariable(
        SPLINE_VARIABLES.isDissected,
        pendingIsDissectedRef.current,
      );
    }

    //This is the real readiness signal for the visual gate. The homepage itself
    //is ALREADY mounted behind that gate, so route/history restoration can finish
    //while the opaque loading surface is still covering the viewport.
    setSceneReady(true);
  }

  const handleLoaderComplete = useCallback(() => {
    //After the perforation reveal has completely exposed the scene, removing
    //this state unmounts SplineLoadingScreen entirely. It leaves no invisible
    //overlay, pointer layer, GSAP loop, or loader DOM above the live Spline scene.
    setLoaderComplete(true);
  }, []);

  useEffect(() => {
    if (
      !isIndexRoute ||
      !sceneReady ||
      !loaderComplete ||
      !hasLockedProjectReturnState ||
      getResponsiveBaseState() === CAMERA_STATES.base ||
      hasIssuedResponsiveRestoreNudgeRef.current
    ) {
      return;
    }

    //The route and all scroll runtimes are mounted behind the loader. Wait two
    //paint frames after the loader has actually completed so React, Spline and
    //the responsive layout have all committed before nudging the already-locked
    //manual timeline through the same wheel path that succeeds for a real user.
    responsiveRestoreNudgeFrameRef.current = requestAnimationFrame(() => {
      responsiveRestoreNudgeFrameRef.current = requestAnimationFrame(() => {
        responsiveRestoreNudgeFrameRef.current = null;

        if (hasIssuedResponsiveRestoreNudgeRef.current) {
          return;
        }

        hasIssuedResponsiveRestoreNudgeRef.current = true;

        window.dispatchEvent(
          new WheelEvent("wheel", {
            deltaY: RESPONSIVE_ROUTE_RETURN_NUDGE_DELTA_PX,
            deltaMode: WheelEvent.DOM_DELTA_PIXEL,
            bubbles: true,
            cancelable: true,
          }),
        );
      });
    });

    return () => {
      if (responsiveRestoreNudgeFrameRef.current !== null) {
        cancelAnimationFrame(responsiveRestoreNudgeFrameRef.current);
        responsiveRestoreNudgeFrameRef.current = null;
      }
    };
  }, [hasLockedProjectReturnState, isIndexRoute, loaderComplete, sceneReady]);

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

        //Temporarily disable manual CameraState keyboard overrides.
        //Keep the code here (rather than deleting it) so these development
        //shortcuts can be restored later without reconstructing the mapping.
        // case "i":
        //   setCameraState(CAMERA_STATES.side);
        //   break;

        // case "f":
        //   setCameraState(CAMERA_STATES.front);
        //   break;

        // case "b":
        //   setCameraState(CAMERA_STATES.back);
        //   break;

        // case "p":
        //   setCameraState(CAMERA_STATES.projects);
        //   break;

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

        {/*
          IMPORTANT: keep the route mounted from the beginning.

          The loader is only an opaque visual gate. Mounting <Outlet /> now lets
          the homepage's existing route-return restoration register its section
          runtimes and restore window/timeline state BEHIND the loader. Therefore
          returning from /experience/frontend/:projectSlug no longer reveals the
          index at scrollY 0 and then visibly snaps back to the saved project.
        */}
        <Outlet />

        {isIndexRoute && !loaderComplete ? (
          <SplineLoadingScreen
            sceneReady={sceneReady}
            onComplete={handleLoaderComplete}
          />
        ) : null}
      </div>
    </main>
  );
}
