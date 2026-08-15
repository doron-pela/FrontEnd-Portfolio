export const SPLINE_SCENE_URL =
  "https://prod.spline.design/sUMyxeYwXvQtZ9Ap/scene.splinecode";

export const SPLINE_VARIABLES = {
  cameraState: "CameraState",
  isDissected: "IsDissected",
} as const;

export const CAMERA_STATES = {
  mobileBase: -2,
  tabletBase: -1,
  base: 0,
  side: 0.5,
  front: 1,
  back: 2,
  projects: 3,
} as const;

export const SPLINE_BREAKPOINTS = {
  mobile: 700,
  tablet: 1100,
} as const;
