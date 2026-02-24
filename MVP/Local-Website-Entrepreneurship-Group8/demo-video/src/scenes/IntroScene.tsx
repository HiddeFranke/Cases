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
  weights: ["400", "700", "800"],
  subsets: ["latin"],
});

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const logoScale = interpolate(logoProgress, [0, 1], [0.8, 1]);
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);

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
          gap: 30,
        }}
      >
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            fontSize: 96,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          <span style={{ color: "#2563eb" }}>Woon</span>plek
        </div>
        <AnimatedText
          text="Find your Amsterdam apartment — automatically"
          delay={15}
          fontSize={36}
          color="rgba(255,255,255,0.7)"
          fontWeight={400}
          fontFamily={fontFamily}
        />
      </div>
    </AbsoluteFill>
  );
};
