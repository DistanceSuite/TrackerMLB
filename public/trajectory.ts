import * as THREE from "three";

interface HitData {
  launch_speed: number;   // mph
  launch_angle: number;   // degrees
  spray_angle: number;    // degrees (left/right spray)
  spin_rate: number;      // rpm
}

export function simulateTrajectory(hit: HitData) {
  const g = 32.174; // ft/s^2

  // Baseball constants
  const rho = 0.002376;  // air density slugs/ft^3 (sea level)
  const Cd = 0.35;       // drag coefficient
  const Cl = 0.2;        // lift coefficient (approx, changes w/ spin)
  const A = 0.00426;     // ft^2 cross-sectional area (2.9 in dia)
  const m = 0.32;        // slugs (~145 g)

  // Convert launch params
  const v0 = hit.launch_speed * 1.467; // mph → ft/s
  const theta = (hit.launch_angle * Math.PI) / 180; // radians
  const phi = (hit.spray_angle * Math.PI) / 180;    // spray azimuth

  // Initial velocity components
  let vx = v0 * Math.cos(theta) * Math.sin(phi);
  let vy = v0 * Math.sin(theta);
  let vz = v0 * -Math.cos(theta) * Math.cos(phi);

  // Position
  let x = 0, y = 3, z = 0; // start at 3 ft above ground
  const dt = 0.01; // timestep (s)

  const points: THREE.Vector3[] = [];

  while (y >= 0) {
    points.push(new THREE.Vector3(x, y, z));

    // Speed magnitude
    const v = Math.sqrt(vx*vx + vy*vy + vz*vz);

    // Drag force coefficient
    const Fd = 0.5 * rho * Cd * A * v * v;

    // Magnus force coefficient (simplified proportional to spin & v)
    const spinFactor = hit.spin_rate ? hit.spin_rate / 2200 : 1; // normalize
    const Fm = 0.5 * rho * Cl * A * v * v * spinFactor;

    // Unit velocity vector
    const ux = vx / v, uy = vy / v, uz = vz / v;

    // Drag accelerations (opposite velocity)
    const ax_drag = -(Fd/m) * ux;
    const ay_drag = -(Fd/m) * uy;
    const az_drag = -(Fd/m) * uz;

    // Magnus accelerations (lift roughly upward, orthogonal to v)
    // Simple model: lift points mostly upward, scaled by horizontal speed
    const ax_magnus = 0;
    const ay_magnus = (Fm/m) * Math.cos(theta); // upward lift
    const az_magnus = 0;

    // Total accelerations
    const ax = ax_drag + ax_magnus;
    const ay = -g + ay_drag + ay_magnus;
    const az = az_drag;

    // Integrate velocity
    vx += ax * dt;
    vy += ay * dt;
    vz += az * dt;

    // Integrate position
    x += vx * dt;
    y += vy * dt;
    z += vz * dt;
  }

  return points;
}
