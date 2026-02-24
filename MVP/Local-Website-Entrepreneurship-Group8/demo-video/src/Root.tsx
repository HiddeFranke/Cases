import { Composition } from "remotion";
import { DemoVideo } from "./DemoVideo";

// Scene durations
const SCENE_DURATIONS = [120, 120, 180, 240, 180, 240, 150, 120, 150];
const TRANSITION_DURATION = 15;
const NUM_TRANSITIONS = SCENE_DURATIONS.length - 1; // 8

const TOTAL_FRAMES =
  SCENE_DURATIONS.reduce((a, b) => a + b, 0) -
  NUM_TRANSITIONS * TRANSITION_DURATION;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DemoVideo"
      component={DemoVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
