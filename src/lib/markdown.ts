import { satteriHeadingIdsPlugin } from "@astrojs/markdown-satteri";
import type { ElementContent } from "hast";
import { defineHastPlugin, type HastPluginList, htmlToHast } from "satteri";
import { highlight } from "sugar-high";

/*
 * Build-time Markdown/MDX plugins. Posts stay plain MDX: no imports, and the
 * same chart tags work as before.
 */

// Every <code>, inline or fenced, goes through sugar-high.
const sugarHigh = defineHastPlugin({
  name: "sugar-high",
  element: {
    filter: ["code"],
    visit(node, ctx) {
      const tree = htmlToHast(highlight(ctx.textContent(node)), {
        fragment: true,
      });
      if (!("children" in tree)) return;
      // sugar-high only emits spans and text.
      const children: ElementContent[] = [];
      for (const child of tree.children) {
        if (child.type === "element" || child.type === "text") {
          children.push(child);
        }
      }
      ctx.replaceNode(node, { ...node, children });
    },
  },
});

// An empty link inside each heading. The CSS draws the "#".
const headingAnchors = defineHastPlugin({
  name: "heading-anchors",
  element: {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    visit(node, ctx) {
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      ctx.prependChild(node, {
        type: "element",
        tagName: "a",
        properties: { href: `#${id}`, className: ["anchor"] },
        children: [],
      });
    },
  },
});

// Links that leave the site open in a new tab.
const externalLinks = defineHastPlugin({
  name: "external-links",
  element: {
    filter: ["a"],
    visit(node, ctx) {
      const href = node.properties?.href;
      if (typeof href !== "string" || /^[/#]/.test(href)) return;
      ctx.setProperty(node, "target", "_blank");
      ctx.setProperty(node, "rel", "noopener noreferrer");
    },
  },
});

/*
 * <Bars><Bar label="x" value="1" /></Bars> becomes <Bars rows={[...]} />.
 * An Astro component only sees its children as rendered HTML, so the parent
 * could never read the rows' props. Same for <Stack>/<Seg> and <Duo>/<Pair>.
 */
const chartRows = { Bars: "Bar", Stack: "Seg", Duo: "Pair" } as const;

const chartRowsPlugin = defineHastPlugin({
  name: "chart-rows",
  mdxJsxFlowElement: {
    filter: Object.keys(chartRows),
    visit(node, ctx) {
      const parent = node.name as keyof typeof chartRows;
      const rows: Record<string, string>[] = [];
      for (const child of node.children) {
        if (child.type === "text" && !child.value.trim()) continue;
        const part = chartRows[parent];
        if (child.type !== "mdxJsxFlowElement" || child.name !== part) {
          throw new Error(`<${parent}> can only contain <${part} /> rows.`);
        }
        const row: Record<string, string> = {};
        for (const attr of child.attributes) {
          if (
            attr.type !== "mdxJsxAttribute" ||
            typeof attr.value !== "string"
          ) {
            throw new Error(`<${part}> props must be plain strings.`);
          }
          row[attr.name] = attr.value;
        }
        rows.push(row);
      }
      ctx.replaceNode(node, {
        ...node,
        attributes: [
          ...node.attributes,
          {
            type: "mdxJsxAttribute",
            name: "rows",
            value: {
              type: "mdxJsxAttributeValueExpression",
              value: JSON.stringify(rows),
            },
          },
        ],
        children: [],
      });
    },
  },
});

/*
 * Astro fills in heading ids after user plugins run, so the anchors need
 * their own copy of that plugin ahead of them.
 */
export const markdownPlugins: HastPluginList = [
  sugarHigh,
  satteriHeadingIdsPlugin(),
  headingAnchors,
  externalLinks,
  chartRowsPlugin,
];
