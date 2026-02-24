import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { AnimatedText } from "../components/AnimatedText";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

const painPoints = [
  "300+ applicants per listing",
  "Hours spent refreshing websites",
  "Generic cover letters ignored",
];

export const ProblemScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
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
          gap: 24,
        }}
      >
        <AnimatedText
          text="Apartment hunting in Amsterdam is brutal."
          delay={0}
          fontSize={52}
          color="#ffffff"
          fontWeight={700}
          fontFamily={fontFamily}
          maxWidth={900}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 20,
          }}
        >
          {painPoints.map((point, i) => (
            <AnimatedText
              key={point}
              text={`${point}`}
              delay={20 + i * 15}
              fontSize={32}
              color="#f87171"
              fontWeight={600}
              fontFamily={fontFamily}
              textAlign="center"
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
