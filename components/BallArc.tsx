import * as THREE from "three";
import { Line } from "@react-three/drei";

export function BallArc({ start, apex, end }: { start: THREE.Vector3; apex: THREE.Vector3; end: THREE.Vector3 }) {
  const points: THREE.Vector3[] = [];
  const steps = 50;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p0 = start.clone().multiplyScalar((1 - t) * (1 - t));
    const p1 = apex.clone().multiplyScalar(2 * (1 - t) * t);
    const p2 = end.clone().multiplyScalar(t * t);
    points.push(p0.add(p1).add(p2));
  }

  return <Line points={points} color="red" lineWidth={5} />;
}
