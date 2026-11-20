// The nav wordmark's hover, handed to the canvas: the DOM target writes, HeroStage reads each frame.

let isHovered = false;

export function setWordmarkHovered(hovered: boolean): void {
  isHovered = hovered;
}

export function isWordmarkHovered(): boolean {
  return isHovered;
}
