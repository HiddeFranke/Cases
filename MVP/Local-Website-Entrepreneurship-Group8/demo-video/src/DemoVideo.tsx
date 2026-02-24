import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { IntroScene } from "./scenes/IntroScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { FeatureScene } from "./scenes/FeatureScene";
import { CtaScene } from "./scenes/CtaScene";

const TRANSITION_DURATION = 15;

const scenes = [
  { id: "intro", duration: 120, component: <IntroScene /> },
  { id: "problem", duration: 120, component: <ProblemScene /> },
  {
    id: "dashboard",
    duration: 180,
    component: (
      <FeatureScene
        screenshotSrc="dashboard.png"
        title="Your rental command center"
        subtitle="See all your applications, matches, and listings in one place"
        layoutDirection="left"
      />
    ),
  },
  {
    id: "matches",
    duration: 240,
    component: (
      <FeatureScene
        screenshotSrc="matches.png"
        title="Browse listings on an interactive map"
        subtitle="Filter by neighborhood and find exactly where you want to live"
        layoutDirection="right"
      />
    ),
  },
  {
    id: "filters",
    duration: 180,
    component: (
      <FeatureScene
        screenshotSrc="filters.png"
        title="Set your preferences"
        subtitle="Neighborhood, budget, size — we only show what fits"
        layoutDirection="left"
      />
    ),
  },
  {
    id: "agents",
    duration: 240,
    component: (
      <FeatureScene
        screenshotSrc="agents-with-jobs.png"
        title="One click to apply"
        subtitle="AI writes a personalized cover letter and applies for you"
        layoutDirection="right"
      />
    ),
  },
  {
    id: "integrations",
    duration: 150,
    component: (
      <FeatureScene
        screenshotSrc="integrations.png"
        title="Connect Pararius"
        subtitle="Let Woonplek scrape new listings and do the rest"
        layoutDirection="left"
      />
    ),
  },
  {
    id: "tips",
    duration: 120,
    component: (
      <FeatureScene
        screenshotSrc="tips.png"
        title="Expert tips to boost your success"
        subtitle="Learn what landlords look for and stand out from the crowd"
        layoutDirection="right"
      />
    ),
  },
  { id: "cta", duration: 150, component: <CtaScene /> },
];

const directions = [
  "from-left",
  "from-right",
  "from-left",
  "from-right",
  "from-left",
  "from-right",
  "from-left",
  "from-right",
] as const;

export const DemoVideo: React.FC = () => {
  return (
    <TransitionSeries>
      {scenes.flatMap((scene, i) => {
        const elements: React.ReactNode[] = [];
        if (i > 0) {
          elements.push(
            <TransitionSeries.Transition
              key={`t-${scene.id}`}
              presentation={slide({
                direction: directions[(i - 1) % directions.length],
              })}
              timing={linearTiming({
                durationInFrames: TRANSITION_DURATION,
              })}
            />
          );
        }
        elements.push(
          <TransitionSeries.Sequence
            key={scene.id}
            durationInFrames={scene.duration}
          >
            {scene.component}
          </TransitionSeries.Sequence>
        );
        return elements;
      })}
    </TransitionSeries>
  );
};
