import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { AnimatedText } from "../components/AnimatedText";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const buttonProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 200 },
  });
  const buttonScale = interpolate(buttonProgress, [0, 1], [0.8, 1]);
  const buttonOpacity = interpolate(buttonProgress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <AnimatedText
          text="Start finding your home today"
          delay={0}
          fontSize={60}
          color="#ffffff"
          fontWeight={800}
          fontFamily={fontFamily}
        />
        <div
          style={{
            opacity: buttonOpacity,
            transform: `scale(${buttonScale})`,
            backgroundColor: "#2563eb",
            padding: "20px 60px",
            borderRadius: 12,
            fontSize: 32,
            fontWeight: 700,
            color: "#ffffff",
            fontFamily,
            boxShadow: "0 8px 30px rgba(37, 99, 235, 0.4)",
          }}
        >
          Try Woonplek
        </div>
        <AnimatedText
          text="woonplek.nl"
          delay={40}
          fontSize={24}
          color="rgba(255,255,255,0.5)"
          fontWeight={400}
          fontFamily={fontFamily}
        />
      </div>
    </AbsoluteFill>
  );
};
