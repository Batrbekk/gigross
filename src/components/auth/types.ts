export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export interface ContainerBounds {
  width: number;
  height: number;
}

export interface BallPhysics {
  damping: number;
  stiffness: number;
  mass: number;
  restDelta: number;
}

export interface AuthGlassPanelProps {
  className?: string;
}

export interface AnimatedSpheresProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

export interface GlassOverlayProps {
  className?: string;
}
