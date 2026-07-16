
// 'use client';

// import { useEffect, useRef } from 'react';
// import nipplejs from 'nipplejs';

// interface VirtualJoystickProps {
//   screenW: number;
//   screenH: number;
//   dataChannel?: RTCDataChannel | null;
// }

// export default function VirtualJoystick({
//   screenW,
//   screenH,
//   dataChannel,
// }: VirtualJoystickProps) {
//   const joystickRef = useRef<HTMLDivElement>(null);
//   const moveRef = useRef({ dx: 0, dy: 0 });
//   const frameRef = useRef<number | null>(null);

//   useEffect(() => {
//     if (!joystickRef.current) return;

//     const joystick = nipplejs.create({
//       zone: joystickRef.current,
//       mode: 'static',
//       position: { left: '50%', top: '50%' },
//       size: 120,
//       color: 'white',
//       restOpacity: 0.5,
//     });

//     // scale based on remote screen size
//     const sensitivity = Math.max(screenW, screenH) / 700;

//     const sendMovement = () => {
//       if (
//         dataChannel &&
//         dataChannel.readyState === 'open' &&
//         (moveRef.current.dx !== 0 || moveRef.current.dy !== 0)
//       ) {
//         dataChannel.send(
//           JSON.stringify({
//             type: 'mouse-move',
//             dx: moveRef.current.dx,
//             dy: moveRef.current.dy,
//           })
//         );
//       }

//       frameRef.current = requestAnimationFrame(sendMovement);
//     };

//     joystick.on('move', (_, data) => {
//       if (!data || !data.angle || !data.distance) return;

//       const angle = data.angle.radian;
//       const force = Math.min(data.distance / 50, 2);

//       // smoother movement
//       const dx = Math.cos(angle) * force * sensitivity * 8;
//       const dy = Math.sin(angle) * force * sensitivity * 8;

//       moveRef.current = { dx, dy };
//     });

//     joystick.on('end', () => {
//       moveRef.current = { dx: 0, dy: 0 };
//     });

//     sendMovement();

//     return () => {
//       joystick.destroy();

//       if (frameRef.current) {
//         cancelAnimationFrame(frameRef.current);
//       }
//     };
//   }, [dataChannel, screenW, screenH]);


//   return (
//     <div
//       className=" z-50"
//       style={{ touchAction: 'none' }}
//     >
//       <div
//         ref={joystickRef}
//         className="w-40 h-40 rounded-full bg-black/30 backdrop-blur-lg border border-white/20"
//       />
//     </div>
//   );
// }

