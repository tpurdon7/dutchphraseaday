type HouseSpec = {
  x: number;
  width: number;
  height: number;
  body: string;
  roof: "gable" | "step" | "bell";
};

type BoatSpec = {
  x: number;
  y: number;
  width: number;
  hull: string;
};

const HOUSES: HouseSpec[] = [
  { x: 10, width: 78, height: 210, body: "#E4B29A", roof: "gable" },
  { x: 94, width: 64, height: 186, body: "#C98D84", roof: "step" },
  { x: 164, width: 72, height: 228, body: "#A9BED0", roof: "bell" },
  { x: 244, width: 66, height: 198, body: "#DAB7A5", roof: "gable" },
  { x: 316, width: 74, height: 218, body: "#94AFC4", roof: "step" },
  { x: 396, width: 62, height: 176, body: "#C89A90", roof: "bell" },
  { x: 464, width: 84, height: 224, body: "#DBC6AE", roof: "gable" },
  { x: 554, width: 62, height: 192, body: "#9DB9A2", roof: "step" },
  { x: 622, width: 78, height: 212, body: "#CE8F82", roof: "bell" },
  { x: 706, width: 70, height: 204, body: "#B5C4D6", roof: "gable" },
  { x: 782, width: 62, height: 176, body: "#DBB09B", roof: "step" },
  { x: 850, width: 86, height: 232, body: "#8FAAC1", roof: "gable" },
  { x: 942, width: 66, height: 194, body: "#D4A39A", roof: "bell" },
  { x: 1014, width: 74, height: 218, body: "#DCC2A8", roof: "step" },
  { x: 1094, width: 74, height: 206, body: "#9AB4A0", roof: "gable" }
];

const BOATS: BoatSpec[] = [
  { x: 180, y: 585, width: 120, hull: "#42556A" },
  { x: 620, y: 610, width: 96, hull: "#5A6F82" },
  { x: 980, y: 595, width: 110, hull: "#3F4E5F" }
];

const Roof = ({ house }: { house: HouseSpec }) => {
  const left = house.x;
  const right = house.x + house.width;
  const top = 360 - house.height;

  if (house.roof === "step") {
    return (
      <path
        d={`M ${left} ${top} L ${left + 8} ${top - 12} L ${left + 16} ${top - 12} L ${left + 16} ${top - 24} L ${right - 16} ${top - 24} L ${right - 16} ${top - 12} L ${right - 8} ${top - 12} L ${right} ${top} Z`}
        fill="#6C4D43"
      />
    );
  }

  if (house.roof === "bell") {
    const mid = (left + right) / 2;
    return <path d={`M ${left} ${top} Q ${mid} ${top - 38} ${right} ${top} Z`} fill="#654840" />;
  }

  const mid = (left + right) / 2;
  return <path d={`M ${left} ${top} L ${mid} ${top - 32} L ${right} ${top} Z`} fill="#6A4A3F" />;
};

const HousesRow = ({ offset = 0 }: { offset?: number }) => {
  return (
    <g transform={`translate(${offset},0)`}>
      {HOUSES.map((house) => {
        const top = 360 - house.height;
        const windowColor = "rgba(255, 250, 241, 0.82)";
        const xCenter = house.x + house.width / 2;
        return (
          <g key={`${offset}-${house.x}`}>
            <rect x={house.x} y={top} width={house.width} height={house.height} rx="5" fill={house.body} />
            <Roof house={house} />
            <rect x={xCenter - 10} y={330} width={20} height={30} fill="#60453E" opacity="0.78" />
            <rect x={house.x + 10} y={top + 24} width={14} height={18} rx="1" fill={windowColor} />
            <rect x={house.x + house.width - 24} y={top + 24} width={14} height={18} rx="1" fill={windowColor} />
            <rect x={house.x + 10} y={top + 62} width={14} height={18} rx="1" fill={windowColor} />
            <rect x={house.x + house.width - 24} y={top + 62} width={14} height={18} rx="1" fill={windowColor} />
            <rect x={xCenter - 7} y={top + 58} width={14} height={22} rx="1" fill={windowColor} />
          </g>
        );
      })}
    </g>
  );
};

const BoatsRow = ({ offset = 0 }: { offset?: number }) => {
  return (
    <g transform={`translate(${offset},0)`}>
      {BOATS.map((boat) => (
        <g key={`${offset}-${boat.x}`}>
          <ellipse cx={boat.x + boat.width * 0.45} cy={boat.y + 18} rx={boat.width * 0.58} ry="9" fill="#2B3A4A" opacity="0.18" />
          <path
            d={`M ${boat.x} ${boat.y} L ${boat.x + boat.width} ${boat.y} L ${boat.x + boat.width - 18} ${boat.y + 18} L ${boat.x + 18} ${boat.y + 18} Z`}
            fill={boat.hull}
          />
          <rect x={boat.x + 26} y={boat.y - 10} width={Math.max(26, boat.width * 0.24)} height="10" rx="2" fill="#DDE6EE" />
        </g>
      ))}
    </g>
  );
};

export const AmsterdamBackground = () => {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg viewBox="0 0 1200 800" className="h-full w-full ams-bg-svg" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="ams-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8f6f1" />
            <stop offset="55%" stopColor="#e8eff7" />
            <stop offset="100%" stopColor="#d9e2eb" />
          </linearGradient>
          <linearGradient id="ams-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93aab9" />
            <stop offset="100%" stopColor="#6f8696" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="1200" height="800" fill="url(#ams-sky)" />

        <g className="ams-layer-far">
          <HousesRow />
          <HousesRow offset={1200} />
        </g>

        <rect x="0" y="360" width="1200" height="4" fill="#8c9ca8" opacity="0.45" />

        <g className="ams-wave-layer">
          <rect x="0" y="364" width="1200" height="436" fill="url(#ams-water)" />
          <path d="M 0 470 Q 120 464 240 470 T 480 470 T 720 470 T 960 470 T 1200 470" stroke="#d7e3ea" strokeOpacity="0.26" strokeWidth="2" fill="none" />
          <path d="M 0 520 Q 100 514 200 520 T 400 520 T 600 520 T 800 520 T 1000 520 T 1200 520" stroke="#d7e3ea" strokeOpacity="0.18" strokeWidth="2" fill="none" />
        </g>

        <g className="ams-boat-layer ams-boat-a">
          <BoatsRow />
          <BoatsRow offset={1200} />
        </g>

        <g className="ams-boat-layer ams-boat-b">
          <BoatsRow />
          <BoatsRow offset={1200} />
        </g>

        <g className="ams-layer-fore">
          <path d="M 70 420 Q 175 382 280 420 L 286 434 L 62 434 Z" fill="#6c7f8f" opacity="0.48" />
          <path d="M 830 430 Q 930 390 1038 430 L 1044 442 L 822 442 Z" fill="#6f8393" opacity="0.43" />
          <circle cx="138" cy="398" r="16" fill="#9ab09d" opacity="0.65" />
          <circle cx="162" cy="392" r="18" fill="#9ab09d" opacity="0.58" />
          <rect x="150" y="398" width="5" height="26" fill="#6a5a4e" opacity="0.62" />
          <circle cx="1030" cy="406" r="15" fill="#9ab09d" opacity="0.64" />
          <circle cx="1050" cy="398" r="17" fill="#9ab09d" opacity="0.56" />
          <rect x="1040" y="404" width="5" height="24" fill="#6a5a4e" opacity="0.62" />
        </g>
      </svg>
    </div>
  );
};
