import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { AnimatedText } from "../components/AnimatedText";
import { ScreenshotFrame } from "../components/ScreenshotFrame";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

type FeatureSceneProps = {
  screenshotSrc: string;
  title: string;
  subtitle: string;
  layoutDirection?: "left" | "right";
};

export const FeatureScene: React.FC<FeatureSceneProps> = ({
  screenshotSrc,
  title,
  subtitle,
  layoutDirection = "left",
}) => {
  const isLeft = layoutDirection === "left";

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isLeft ? "row" : "row-reverse",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "0 80px",
          gap: 60,
        }}
      >
        <div style={{ flex: "0 0 auto" }}>
          <ScreenshotFrame src={screenshotSrc} delay={5} width={920} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 480,
          }}
        >
          <AnimatedText
            text={title}
            delay={10}
            fontSize={44}
            color="#ffffff"
            fontWeight={700}
            fontFamily={fontFamily}
            textAlign={isLeft ? "left" : "right"}
          />
          <AnimatedText
            text={subtitle}
            delay={20}
            fontSize={26}
            color="rgba(255,255,255,0.6)"
            fontWeight={400}
            fontFamily={fontFamily}
            textAlign={isLeft ? "left" : "right"}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
