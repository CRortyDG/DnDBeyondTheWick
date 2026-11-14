"use client";

// Make a silhouette from a portrait, in the DM's browser (Cloudflare Workers
// can't decode images within their CPU limit). The background is whatever
// touches the edge of the picture and looks like the edge: transparent pixels,
// or colours close to the average edge colour. Everything else turns dark.

const SIZE = 320;
const DARK = [27, 19, 13];

export async function makeSilhouette(src: string): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Couldn't load that picture."));
    i.src = src;
  });
  const scale = Math.min(1, SIZE / Math.max(img.naturalWidth || SIZE, img.naturalHeight || SIZE));
  const w = Math.max(1, Math.round((img.naturalWidth || SIZE) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || SIZE) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext("2d", { willReadFrequently: true });
  if (!c) throw new Error("This browser can't draw pictures.");
  c.drawImage(img, 0, 0, w, h);
  const data = c.getImageData(0, 0, w, h);
  const px = data.data;

  // The average colour of the opaque pixels along the edge.
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  const edge = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    if (px[i + 3] < 128) return;
    r += px[i];
    g += px[i + 1];
    b += px[i + 2];
    n++;
  };
  for (let x = 0; x < w; x++) (edge(x, 0), edge(x, h - 1));
  for (let y = 0; y < h; y++) (edge(0, y), edge(w - 1, y));
  const bg = n ? [r / n, g / n, b / n] : null;
  const isBg = (i: number) => px[i + 3] < 40 || (!!bg && Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) < 90);

  // Flood in from the edges.
  const out = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const k = y * w + x;
    if (out[k] || !isBg(k * 4)) return;
    out[k] = 1;
    stack.push(k);
  };
  for (let x = 0; x < w; x++) (push(x, 0), push(x, h - 1));
  for (let y = 0; y < h; y++) (push(0, y), push(w - 1, y));
  while (stack.length) {
    const k = stack.pop()!;
    const x = k % w,
      y = (k - x) / w;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  for (let k = 0; k < w * h; k++) {
    const i = k * 4;
    if (out[k]) {
      px[i + 3] = 0;
    } else {
      px[i] = DARK[0];
      px[i + 1] = DARK[1];
      px[i + 2] = DARK[2];
      px[i + 3] = 235;
    }
  }
  c.putImageData(data, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't make the silhouette."))), "image/png"));
}
