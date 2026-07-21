import { Composition } from "remotion";
import { DemoComposition, DEMO_DURATION_FRAMES } from "./DemoComposition";

// Root registers each composition Remotion can render / preview.
// The composition id ("Demo") is what the render CLI targets.
export function RemotionRoot() {
  return (
    <Composition
      id="Demo"
      component={DemoComposition}
      durationInFrames={DEMO_DURATION_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
