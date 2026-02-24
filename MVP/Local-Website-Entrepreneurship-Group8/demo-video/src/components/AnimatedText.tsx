import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type AnimatedTextProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  maxWidth?: number;
  lineHeight?: number;
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  fontSize = 48,
  color = "#ffffff",
  fontWeight = 400,
  fontFamily = "Inter",
  textAlign = "center",
  maxWidth,
  lineHeight = 1.3,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontSize,
        color,
        fontWeight,
        fontFamily,
        textAlign,
        lineHeight,
        maxWidth,
      }}
    >
      {text}
    </div>
  );
};
