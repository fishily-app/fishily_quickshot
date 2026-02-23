import React from "react";

export type ScreenshotTemplateProps = {
  imageDataUrl?: string;
  title: string;
  subtitle?: string;
};

export const ScreenshotTemplate = ({
  ref,
  imageDataUrl,
  title,
  subtitle,
}: ScreenshotTemplateProps & {
  ref?: React.RefObject<SVGSVGElement | null>;
}) => {
  const W = 1080;
  const H = 1080;

  const padding = 72;
  const titleAreaHeight = 190;
  const gap = 28;

  const screenW = 540;
  const screenX = W / 2 - screenW / 2;
  const screenY = padding + titleAreaHeight + gap;
  const screenH = H - screenY;

  const r = 84;

  const frameT = 15;

  const outerX = screenX - frameT;
  const outerY = screenY - frameT;
  const outerW = screenW + frameT * 2;
  const outerH = screenH + frameT * 2;

  const outerR = r + frameT;

  const dTopRoundedBottomSquare = (
    x: number,
    y: number,
    w: number,
    h: number,
    rad: number,
  ) => `
      M ${x} ${y + rad}
      Q ${x} ${y} ${x + rad} ${y}
      L ${x + w - rad} ${y}
      Q ${x + w} ${y} ${x + w} ${y + rad}
      L ${x + w} ${y + h}
      L ${x} ${y + h}
      Z
    `;

  const dScreen = dTopRoundedBottomSquare(
    screenX,
    screenY,
    screenW,
    screenH,
    r,
  );
  const dOuter = dTopRoundedBottomSquare(
    outerX,
    outerY,
    outerW,
    outerH,
    outerR,
  );

  const clipId = React.useId();
  const shadowId = React.useId();

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className="svg-square"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={dScreen} />
        </clipPath>

        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="24"
            stdDeviation="24"
            floodColor="#000000"
            floodOpacity="0.35"
          />
          <feDropShadow
            dx="0"
            dy="10"
            stdDeviation="12"
            floodColor="#000000"
            floodOpacity="0.2"
          />
        </filter>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill="#f9f9ff" />

      <text
        x={W / 2}
        y={padding + 60}
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
        fontSize="54"
        fontWeight="700"
        textAnchor="middle"
        fill="#000000"
      >
        {title || "Title goes here"}
      </text>

      <text
        x={W / 2}
        y={padding + 125}
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
        fontSize="54"
        fontWeight="700"
        textAnchor="middle"
        fill="#707070"
      >
        {subtitle || "subtitle goes here"}
      </text>

      <path
        d={`${dOuter} ${dScreen}`}
        fill="#3f3f3f"
        fillRule="evenodd"
        filter={`url(#${shadowId})`}
      />

      <path
        d={dOuter}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="3"
      />

      {imageDataUrl ? (
        <image
          href={imageDataUrl}
          x={screenX}
          y={screenY}
          width={screenW}
          height={screenH}
          preserveAspectRatio="xMidYMin slice"
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <rect
          x={screenX}
          y={screenY}
          width={screenW}
          height={screenH}
          fill="#151518"
          clipPath={`url(#${clipId})`}
        />
      )}
    </svg>
  );
};

ScreenshotTemplate.displayName = "SquareTemplate";
