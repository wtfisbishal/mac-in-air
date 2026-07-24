import React from "react";

const MagicMouse = ({ className }) => {
  return (
    <div className={`relative w-fit ${className ?? ""}`}>
      <div className="absolute left-1/2 bottom-[-10px] -translate-x-1/2 w-[150px] h-[26px] rounded-full bg-black/25 blur-lg" />

      <svg
        width=" "
        height="320"
        viewBox="0 0 200 320"
        className="relative max-md:w-[160px] drop-shadow-[0_14px_20px_rgba(0,0,0,0.25)]"
      >
        <defs>
          <linearGradient id="mm-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdfdfe" />
            <stop offset="55%" stopColor="#eceef1" />
            <stop offset="100%" stopColor="#d3d5da" />
          </linearGradient>

          <linearGradient id="mm-side" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c7c9ce" stopOpacity="0.55" />
            <stop offset="12%" stopColor="#c7c9ce" stopOpacity="0" />
            <stop offset="88%" stopColor="#c7c9ce" stopOpacity="0" />
            <stop offset="100%" stopColor="#c7c9ce" stopOpacity="0.55" />
          </linearGradient>

          <radialGradient id="mm-gloss" cx="50%" cy="0%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          <clipPath id="mm-clip">
            <path d="M100,4 C150,4 187,42 191,112 C195,182 179,258 149,292 C128,313 72,313 51,292 C21,258 5,182 9,112 C13,42 50,4 100,4 Z" />
          </clipPath>
        </defs>

        <path
          d="M100,4 C150,4 187,42 191,112 C195,182 179,258 149,292 C128,313 72,313 51,292 C21,258 5,182 9,112 C13,42 50,4 100,4 Z"
          fill="url(#mm-body)"
          stroke="#c3c5ca"
          strokeWidth="1"
        />

        <svg xmlns="http://www.w3.org/2000/svg"
          x="40"
          y="190"
          width="120" height="50" fill="#BBC0C6" viewBox="0 0 16 16">
          <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
          <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
        </svg>


      </svg>
    </div>
  );
};

export default MagicMouse;