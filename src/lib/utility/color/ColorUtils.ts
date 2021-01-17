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
  if (hex.startsWith("#")) hex = hex.slice(1);
  const big = parseInt(hex, 16);
  return {
    r: (big >> 16) & 255,
    g: (big >> 8) & 255,
    b: big & 255,
  };
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
