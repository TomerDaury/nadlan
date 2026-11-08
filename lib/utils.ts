import { createCn } from "cn/config";

// Class-name merging for Tailwind. The design's custom text sizes (globals.css: text-body,
// text-small, ...) must be registered as font sizes; otherwise the merger mistakes them for
// colors and drops the real color, e.g. a primary button's text-white next to text-body.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "h3", "body-l", "body", "small", "caption"] }],
    },
  },
});
