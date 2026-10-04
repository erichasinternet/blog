import Aside from "./aside.astro";
import Bars from "./bars.astro";
import Clip from "./clip.astro";
import CoderExplorer from "./coder-explorer.astro";
import Duo from "./duo.astro";
import Panel from "./panel.astro";
import Panels from "./panels.astro";
import Stack from "./stack.astro";

// Available in every post without an import. <Bar>, <Seg> and <Pair> are not
// listed on purpose: src/lib/markdown.ts folds them into their parents.
export const components = {
  Aside,
  Bars,
  Clip,
  CoderExplorer,
  Duo,
  Panel,
  Panels,
  Stack,
};
