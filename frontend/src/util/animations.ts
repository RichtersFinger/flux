/**
 * Run a 'hide'-animation using Animation-API.
 * @param element Element to hide.
 */
export function hideElement(
  element: HTMLDivElement & { _animation?: Animation }
) {
  if (element._animation) element._animation.cancel();
  element._animation = element.animate([{ opacity: 0 }], {
    fill: "forwards",
    duration: 150,
  });
}

/**
 * Run a 'show'-animation using Animation-API.
 * @param element Element to hide.
 */
export function showElement(
  element: HTMLDivElement & { _animation?: Animation }
) {
  if (element._animation) element._animation.cancel();
  element._animation = element.animate([{ opacity: 100 }], {
    fill: "forwards",
    duration: 150,
  });
}
