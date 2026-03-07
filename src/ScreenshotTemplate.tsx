import { useId, useMemo, type Ref } from "react";

export type Aspect = "square" | "portrait" | "story";
export type ScreenshotType = "top" | "bottom";

export type ScreenshotTemplateProps = {
  imageDataUrl?: string;
  title: string;
  subtitle: string;
  type: ScreenshotType;
  aspect: Aspect;
  backgroundColor?: string;
  svgRef?: Ref<SVGSVGElement>;
};

type ScaleRange = {
  scale: number;
  min: number;
  max: number;
};

type GapScaleRange = ScaleRange & {
  offset: number;
};

type AspectLayout = {
  size: { w: number; h: number };
  phoneWidthBoost: number;
  phoneScale: number;
  titleFontSize: ScaleRange;
  textEdgeInset: ScaleRange;
  hiddenEdge: ScaleRange;
  titleSubtitleGap: ScaleRange;
  sectionGap: GapScaleRange;
  textShiftDown: ScaleRange;
  minTextPhoneGap: ScaleRange;
};

const ASPECT_LAYOUTS: Record<Aspect, AspectLayout> = {
  square: {
    size: { w: 1080, h: 1080 },
    phoneWidthBoost: 1.26,
    phoneScale: 1,
    titleFontSize: { scale: 0.05, min: 32, max: 58 },
    textEdgeInset: { scale: 0.02, min: 14, max: 32 },
    hiddenEdge: { scale: 0.018, min: 12, max: 28 },
    titleSubtitleGap: { scale: 1.02, min: 34, max: 64 },
    sectionGap: { scale: 0.78, min: 24, max: 46, offset: 18 },
    textShiftDown: { scale: 0.012, min: 8, max: 18 },
    minTextPhoneGap: { scale: 0.72, min: 22, max: 40 },
  },
  portrait: {
    size: { w: 1080, h: 1350 },
    phoneWidthBoost: 1.1,
    phoneScale: 1,
    titleFontSize: { scale: 0.05, min: 32, max: 58 },
    textEdgeInset: { scale: 0.02, min: 14, max: 32 },
    hiddenEdge: { scale: 0.018, min: 12, max: 28 },
    titleSubtitleGap: { scale: 1.02, min: 34, max: 64 },
    sectionGap: { scale: 0.78, min: 24, max: 46, offset: 18 },
    textShiftDown: { scale: 0.012, min: 8, max: 18 },
    minTextPhoneGap: { scale: 0.72, min: 22, max: 40 },
  },
  story: {
    size: { w: 1080, h: 1920 },
    phoneWidthBoost: 1.04,
    phoneScale: 0.950309,
    titleFontSize: { scale: 0.04656, min: 43, max: 81 },
    textEdgeInset: { scale: 0.028518, min: 38, max: 69 },
    hiddenEdge: { scale: 0.072, min: 96, max: 144 },
    titleSubtitleGap: { scale: 0.98, min: 62, max: 92 },
    sectionGap: { scale: 0.03, min: 40, max: 68, offset: 18 },
    textShiftDown: { scale: 0, min: 0, max: 0 },
    minTextPhoneGap: { scale: 0.82, min: 64, max: 96 },
  },
};

const DEVICE_ASPECT_RATIO = 2.16;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveScale(value: number, range: ScaleRange): number {
  return clamp(value * range.scale, range.min, range.max);
}

function dTopRoundedBottomSquare(
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number,
): string {
  return `
      M ${x} ${y + rad}
      Q ${x} ${y} ${x + rad} ${y}
      L ${x + w - rad} ${y}
      Q ${x + w} ${y} ${x + w} ${y + rad}
      L ${x + w} ${y + h}
      L ${x} ${y + h}
      Z
    `;
}

function dTopSquareBottomRounded(
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number,
): string {
  return `
      M ${x} ${y}
      L ${x + w} ${y}
      L ${x + w} ${y + h - rad}
      Q ${x + w} ${y + h} ${x + w - rad} ${y + h}
      L ${x + rad} ${y + h}
      Q ${x} ${y + h} ${x} ${y + h - rad}
      Z
    `;
}

export function ScreenshotTemplate({
  imageDataUrl,
  title,
  subtitle,
  type,
  aspect,
  backgroundColor = "#f9f9ff",
  svgRef,
}: ScreenshotTemplateProps) {
  const layout = ASPECT_LAYOUTS[aspect];
  const { w: W, h: H } = layout.size;

  const geometry = useMemo(() => {
    const titleFontSize = resolveScale(H, layout.titleFontSize);
    const subtitleFontSize = titleFontSize;
    const textEdgeInset = resolveScale(H, layout.textEdgeInset);
    const hiddenEdge = resolveScale(H, layout.hiddenEdge);
    const titleSubtitleGap = clamp(
      titleFontSize * layout.titleSubtitleGap.scale,
      layout.titleSubtitleGap.min,
      layout.titleSubtitleGap.max,
    );
    const subtitleDescender = subtitleFontSize * 0.28;
    const textBlockHeight =
      titleFontSize + titleSubtitleGap + subtitleDescender;
    const sectionGap =
      clamp(
        titleFontSize * layout.sectionGap.scale,
        layout.sectionGap.min,
        layout.sectionGap.max,
      ) + layout.sectionGap.offset;
    const textShiftDown = resolveScale(H, layout.textShiftDown);

    const visiblePhoneHeight =
      H - textEdgeInset * 2 - textBlockHeight - sectionGap;
    const scaledVisiblePhoneHeight = visiblePhoneHeight * layout.phoneScale;
    const screenH = scaledVisiblePhoneHeight + hiddenEdge;
    const screenW = (screenH / DEVICE_ASPECT_RATIO) * layout.phoneWidthBoost;
    const screenX = W / 2 - screenW / 2;

    const baseScreenYBottom = H - scaledVisiblePhoneHeight;
    const topBandEnd = baseScreenYBottom - sectionGap;
    const topBandHeight = Math.max(0, topBandEnd - textEdgeInset);
    const textTopYBottom =
      textEdgeInset +
      Math.max(0, (topBandHeight - textBlockHeight) / 2) +
      textShiftDown;
    const titleYBottom = textTopYBottom + titleFontSize;
    const subtitleYBottom = titleYBottom + titleSubtitleGap;
    const subtitleBottomY = subtitleYBottom + subtitleDescender;
    const minBottomTextPhoneGap = clamp(
      titleFontSize * layout.minTextPhoneGap.scale,
      layout.minTextPhoneGap.min,
      layout.minTextPhoneGap.max,
    );
    const adjustedScreenYBottom = Math.max(
      baseScreenYBottom,
      subtitleBottomY + minBottomTextPhoneGap,
    );

    // Exact vertical mirror of bottom layout for top mode.
    const screenYTop = H - (adjustedScreenYBottom + screenH);
    const textTopYTop = H - (textTopYBottom + textBlockHeight);
    const titleYTop = textTopYTop + titleFontSize;
    const subtitleYTop = titleYTop + titleSubtitleGap;

    const resolvedScreenY = type === "top" ? screenYTop : adjustedScreenYBottom;
    const titleY = type === "top" ? titleYTop : titleYBottom;
    const subtitleY = type === "top" ? subtitleYTop : subtitleYBottom;

    const phoneScale = screenW / 430;
    const r = clamp(78 * phoneScale, 42, 130);
    const frameT = clamp(10.5 * phoneScale, 7, 20);
    const outerStrokeWidth = clamp(3 * phoneScale, 2, 6);
    const imageBleed = clamp(1.5 * phoneScale, 1, 4);

    const outerX = screenX - frameT;
    const outerY = resolvedScreenY - frameT;
    const outerW = screenW + frameT * 2;
    const outerH = screenH + frameT * 2;
    const outerR = r + frameT;

    const pathBuilder =
      type === "bottom" ? dTopRoundedBottomSquare : dTopSquareBottomRounded;

    return {
      titleFontSize,
      subtitleFontSize,
      titleY,
      subtitleY,
      screenX,
      screenH,
      screenW,
      resolvedScreenY,
      dScreen: pathBuilder(screenX, resolvedScreenY, screenW, screenH, r),
      dOuter: pathBuilder(outerX, outerY, outerW, outerH, outerR),
      outerStrokeWidth,
      imageBleed,
    };
  }, [W, H, layout, type]);

  const clipId = useId();
  const shadowId = useId();

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="svg-square"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={geometry.dScreen} />
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

      <rect x="-2" y="-2" width={W + 4} height={H + 4} fill={backgroundColor} />

      <text
        x={W / 2}
        y={geometry.titleY}
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
        fontSize={geometry.titleFontSize}
        fontWeight="700"
        textAnchor="middle"
        fill="#000000"
      >
        {title || "Title goes here"}
      </text>

      <text
        x={W / 2}
        y={geometry.subtitleY}
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
        fontSize={geometry.subtitleFontSize}
        fontWeight="700"
        textAnchor="middle"
        fill="#707070"
      >
        {subtitle || "subtitle goes here"}
      </text>

      <path
        d={`${geometry.dOuter} ${geometry.dScreen}`}
        fill="#555555"
        fillRule="evenodd"
        filter={`url(#${shadowId})`}
      />

      <path
        d={geometry.dOuter}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={geometry.outerStrokeWidth}
      />

      {imageDataUrl ? (
        <image
          href={imageDataUrl}
          x={geometry.screenX - geometry.imageBleed}
          y={geometry.resolvedScreenY - geometry.imageBleed}
          width={geometry.screenW + geometry.imageBleed * 2}
          height={geometry.screenH + geometry.imageBleed * 2}
          preserveAspectRatio={
            type === "top" ? "xMidYMax slice" : "xMidYMin slice"
          }
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <rect
          x={geometry.screenX}
          y={geometry.resolvedScreenY}
          width={geometry.screenW}
          height={geometry.screenH}
          fill="#151518"
          clipPath={`url(#${clipId})`}
        />
      )}
    </svg>
  );
}
