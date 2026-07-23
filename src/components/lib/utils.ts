import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const spacingScale = ["xxs", "xs", "s", "m", "l", "xl"];
const spacingPrefixes = [
  "p",
  "px",
  "py",
  "pt",
  "pr",
  "pb",
  "pl",
  "m",
  "mx",
  "my",
  "mt",
  "mr",
  "mb",
  "ml",
  "gap",
  "gap-x",
  "gap-y",
];
const spacingGroups = Object.fromEntries(
  spacingPrefixes.map((prefix) => [prefix, [{ [prefix]: spacingScale }]]),
);

const backgroundColors = [
  "background-default",
  "background-default-hover",
  "background-accent-default",
  "background-accent-hover",
];
const foregroundColors = [
  "foreground-default",
  "foreground-default-hover",
  "foreground-accent-default",
  "foreground-on-accent",
];
const borderColors = [
  "border-default",
  "border-strong",
  "border-accent",
  "border-focus",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "xs",
            "small",
            "medium",
            "large",
            "xl",
            "xxl",
            "heading-lg",
            "heading-md",
            "heading-sm",
          ],
        },
      ],
      rounded: [{ rounded: ["none", "small", "large", "xl", "xxl", "round"] }],
      "bg-color": [{ bg: backgroundColors }],
      "text-color": [{ text: foregroundColors }],
      "border-color": [{ border: borderColors }],
      ...spacingGroups,
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
