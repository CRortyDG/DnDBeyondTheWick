// Where a map image sits on a screen, and where its pins go. Pins are stored as
// fractions of the image, so they land on the same spot at any screen size.

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The image letterboxed inside the screen: as large as fits, never cropped, centred. */
export function fitBox(outerW: number, outerH: number, imgW: number, imgH: number): Box {
  if (outerW <= 0 || outerH <= 0 || imgW <= 0 || imgH <= 0) return { left: 0, top: 0, width: Math.max(0, outerW), height: Math.max(0, outerH) };
  const scale = Math.min(outerW / imgW, outerH / imgH);
  const width = imgW * scale;
  const height = imgH * scale;
  return { left: (outerW - width) / 2, top: (outerH - height) / 2, width, height };
}

/** A pin's spot in screen pixels, relative to the screen's top-left. */
export function pinToPixels(pin: { x: number; y: number }, box: Box): { x: number; y: number } {
  return { x: box.left + pin.x * box.width, y: box.top + pin.y * box.height };
}

/** A screen point (relative to the image's top-left) back to fractions, kept on the image. */
export function pixelsToPin(px: number, py: number, width: number, height: number): { x: number; y: number } {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return { x: round(clamp(width ? px / width : 0.5)), y: round(clamp(height ? py / height : 0.5)) };
}

/** Four decimal places: a hair under a pixel on a 4K map, and a tidier save file. */
function round(v: number) {
  return Math.round(v * 10000) / 10000;
}

/**
 * Zoom toward a pin: the transform (origin top-left of the image box) that
 * scales the image by z and brings the pin as close to the centre as the
 * image's edges allow, so no black shows where the map could fill the screen.
 */
export function zoomToward(pin: { x: number; y: number }, box: Box, outerW: number, outerH: number, z: number): { tx: number; ty: number; scale: number } {
  const axis = (size: number, outer: number, start: number, frac: number) => {
    const scaled = size * z;
    let lead = outer / 2 - frac * scaled; // where the scaled image's leading edge goes
    if (scaled >= outer) lead = Math.min(0, Math.max(outer - scaled, lead));
    else lead = (outer - scaled) / 2;
    return lead - start;
  };
  return { tx: axis(box.width, outerW, box.left, pin.x), ty: axis(box.height, outerH, box.top, pin.y), scale: z };
}
