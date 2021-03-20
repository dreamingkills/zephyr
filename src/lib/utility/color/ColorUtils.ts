import nearestColor from "nearest-color";
import colorNames from "color-name-list";

export function rgbToCmy(
  r: number,
  g: number,
  b: number
): { c: number; m: number; y: number } {
  return {
    c: (1 - r / 255) * 100,
    m: (1 - g / 255) * 100,
    y: (1 - b / 255) * 100,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return { r, g, b };
}

export function hexToCmy(hex: string): { c: number; m: number; y: number } {
  const rgb = hexToRgb(hex);
  return rgbToCmy(rgb.r, rgb.g, rgb.b);
}

export function getNearestColor(
  hex: string
): {
  name: string;
  value: string;
  rgb: { r: number; g: number; b: number };
  distance: number;
} {
  const nearest = nearestColor.from(
    colorNames.reduce(
      (o, { name, hex }) => Object.assign(o, { [name]: hex }),
      {}
    )
  );
  const trueNearest = nearest(hex) as {
    name: string;
    value: string;
    rgb: { r: number; g: number; b: number };
    distance: number;
  };

  return trueNearest;
}
