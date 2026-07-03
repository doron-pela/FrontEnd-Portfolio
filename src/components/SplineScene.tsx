import { useEffect, useRef } from "react";
import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";

type CameraState = 0 | 1 | 2 | 3;

export default function SplineScene() {
  const splineRef = useRef<Application | null>(null);

  function onLoad(spline: Application) {
    splineRef.current = spline;

    console.log("Spline loaded");
    console.log("Initial Spline variables:", spline.getVariables());
  }

  function setCameraState(value: CameraState) {
    const spline = splineRef.current;

    if (!spline) {
      console.warn("Spline app is not loaded yet.");
      return;
    }

    spline.setVariable("CameraState", value);

    console.log("CameraState updated:", {
      value,
      variables: spline.getVariables(),
    });
  }

  function setIsDissected(value: boolean) {
    const spline = splineRef.current;

    if (!spline) {
      console.warn("Spline app is not loaded yet.");
      return;
    }

    spline.setVariable("IsDissected", value);

    console.log("IsDissected updated:", {
      value,
      variables: spline.getVariables(),
    });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      switch (key) {
        case "0":
          setCameraState(0);
          break;

        case "f":
          setCameraState(1);
          break;

        case "b":
          setCameraState(2);
          break;

        case "p":
          setCameraState(3);
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
        <div className="absolute w-40 h-15 bottom-0 right-0 rounded-tl-2xl bg-[#E3E3E3]"></div>
        {/* <div className="absolute w-full h-[6.5%] bottom-0 bg-[#E3E3E3] flex"/> */}

        <Spline
        // className="spline-canvas"
          scene="https://prod.spline.design/sUMyxeYwXvQtZ9Ap/scene.splinecode"
          onLoad={onLoad}
        />
      </div>
    </main>
  );
}
