import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// Remotion CLI expects a bootstrap file that registers the root component.
// This file is the entrypoint the studio/render commands target.
registerRoot(RemotionRoot);
