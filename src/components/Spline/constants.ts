export const SPLINE_SCENE_URL = "https://prod.spline.design/sUMyxeYwXvQtZ9Ap/scene.splinecode";

export const SPLINE_VARIABLES = {
  cameraState: "CameraState",
  isDissected: "IsDissected",
} as const;

export const CAMERA_STATES = {
  base: 0,
  side: 0.5,
  front: 1,
  back: 2,
  projects: 3,
} as const;
