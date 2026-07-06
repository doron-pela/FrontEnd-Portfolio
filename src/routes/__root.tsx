import * as React from 'react'
import { 
  // Outlet, 
  createRootRoute } from '@tanstack/react-router'
import SplineScene from '@/components/Spline/SplineScene'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      <SplineScene/>
      {/* <Outlet /> */}
    </React.Fragment>
  )
}
