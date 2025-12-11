import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { Logger } from "@/lib/logger";

const loggerType = new Logger();

export class Utils {
  static async loadImageIfProvided(
    imgPath: string | null | undefined,
    logger: typeof loggerType
  ) {
    if (!imgPath) return null;
    const resolved = path.resolve(imgPath);
    logger.info(`Loading image: ${resolved}`);
    return fs.readFile(resolved);
  }

  static async fail(message: string, logger: typeof loggerType) {
    logger.error(message);
    process.exit(1);
  }

  static async ensureFileExists(filePath: string, logger: typeof loggerType) {
    try {
      return fs.access(filePath);
    } catch {
      this.fail(`File not found: ${filePath}`, logger);
    }
  }

  static async validateHexColor(color: string): Promise<boolean> {
    return /^#?[0-9A-Fa-f]{6}$/.test(color);
  }

  static randomHexColor(): string {
    return (
      "#" +
      Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")
        .toUpperCase()
    );
  }

  static toCase(str: string, caseFormat: string): string {
    const parts = str
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(/[\s_-]+/);

    switch (caseFormat) {
      case "camel":
        return parts
          .map((p, i) =>
            i === 0
              ? p.charAt(0).toLowerCase() + p.slice(1)
              : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
          )
          .join("");
      case "pascal":
        return parts
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join("");
      case "kebab":
      default:
        return parts.map((p) => p.toLowerCase()).join("-");
    }
  }

  static previewTemplate: string = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Material Theme Preview</title>
    <style>
      body { font-family: sans-serif; margin: 0; padding: 1rem; transition: background 0.3s, color 0.3s; }
      .toggle { position: fixed; top: 1rem; right: 1rem; cursor: pointer; }
      .colors { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-top: 2rem; }
      .color-card { border: 1px solid transparent; border-radius: 0.5rem; overflow: hidden; text-align: center; }
      .color-swatch { height: 80px; }
      .color-label { padding: 0.5rem; font-size: 0.8rem; }

      body.light { background: {{ LIGHT_BG }}; color: {{ LIGHT_ON_BG }}; }
      body.dark { background: {{ DARK_BG }}; color: {{ DARK_ON_BG }}; }

      body.light .color-card { border-color: {{ LIGHT_OUTLINE }}; }
      body.dark .color-card { border-color: {{ DARK_OUTLINE }}; }

      .light-theme { display: block; }
      .dark-theme { display: none; }
      body.dark .light-theme { display: none; }
      body.dark .dark-theme { display: block; }
    </style>
  </head>
  <body class="light">
    <button class="toggle">Toggle Dark/Light</button>

    <h1>Material Theme Preview</h1>

    <div class="light-theme">
      <h2>Light Theme</h2>
      <div class="colors">{{ LIGHT_COLORS }}</div>
      {{ LIGHT_USAGE }}
    </div>

    <div class="dark-theme">
      <h2>Dark Theme</h2>
      <div class="colors">{{ DARK_COLORS }}</div>
      {{ DARK_USAGE }}
    </div>

    <script>
      const toggle = document.querySelector(".toggle");
      toggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        document.body.classList.toggle("light");
      });
    </script>
  </body>
</html>
`;

  static async getDominantColorHex(imageBuffer: Buffer): Promise<string> {
    // Downscale to a small image for analysis
    const { data, info } = await sharp(imageBuffer)
      .resize(16, 16, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const colorCounts = new Map<string, number>();
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const hex = `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
    }

    let dominantColor = "#000000";
    let maxCount = 0;
    for (const [hex, count] of colorCounts.entries()) {
      if (count > maxCount) {
        dominantColor = hex;
        maxCount = count;
      }
    }
    return dominantColor;
  }

  static hexToRgb(hex: string): [number, number, number] {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) throw new Error(`Invalid hex: ${hex}`);
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }

  static rgbToLab(r: number, g: number, b: number): [number, number, number] {
    const srgb = [r / 255, g / 255, b / 255].map((v) =>
      v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
    );
    const [R, G, B] = srgb;

    const X = R * 0.4124 + G * 0.3576 + B * 0.1805;
    const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
    const Z = R * 0.0193 + G * 0.1192 + B * 0.9505;

    const refX = X / 0.95047;
    const refY = Y / 1.0;
    const refZ = Z / 1.08883;

    const f = (t: number) =>
      t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

    const L = 116 * f(refY) - 16;
    const a = 500 * (f(refX) - f(refY));
    const b_ = 200 * (f(refY) - f(refZ));

    return [L, a, b_];
  }

  static labToLch([L, a, b]: [number, number, number]) {
    const C = Math.sqrt(a * a + b * b);
    let H = (Math.atan2(b, a) * 180) / Math.PI;
    if (H < 0) H += 360;
    return { L, C, H };
  }

  static rgbToOklch(r: number, g: number, b: number) {
    const srgb = [r / 255, g / 255, b / 255].map((v) =>
      v >= 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
    );
    const [R, G, B] = srgb;

    const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
    const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
    const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
    const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

    const C = Math.sqrt(a * a + b_ * b_);
    let H = Math.atan2(b_, a) * (180 / Math.PI);
    if (H < 0) H += 360;

    return { L, C, H };
  }

  static relativeLuminance(r: number, g: number, b: number): number {
    const srgb = [r, g, b].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  static deltaE76(
    lab1: [number, number, number],
    lab2: [number, number, number]
  ): number {
    const [L1, a1, b1] = lab1;
    const [L2, a2, b2] = lab2;
    return Math.sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
  }

  static deltaE00(
    lab1: [number, number, number],
    lab2: [number, number, number]
  ): number {
    const [L1, a1, b1] = lab1;
    const [L2, a2, b2] = lab2;

    const avgL = (L1 + L2) / 2;
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const avgC = (C1 + C2) / 2;

    const G = 0.5 * (1 - Math.sqrt(avgC ** 7 / (avgC ** 7 + 25 ** 7)));
    const a1p = (1 + G) * a1;
    const a2p = (1 + G) * a2;
    const C1p = Math.sqrt(a1p * a1p + b1 * b1);
    const C2p = Math.sqrt(a2p * a2p + b2 * b2);

    const h1p =
      (Math.atan2(b1, a1p) * 180) / Math.PI +
      (Math.atan2(b1, a1p) < 0 ? 360 : 0);
    const h2p =
      (Math.atan2(b2, a2p) * 180) / Math.PI +
      (Math.atan2(b2, a2p) < 0 ? 360 : 0);

    const dLp = L2 - L1;
    const dCp = C2p - C1p;

    let dhp = h2p - h1p;
    if (C1p * C2p !== 0) {
      if (dhp > 180) dhp -= 360;
      else if (dhp < -180) dhp += 360;
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);

    const avgLp = (L1 + L2) / 2;
    const avgCp = (C1p + C2p) / 2;

    let avgHp = h1p + h2p;
    if (C1p * C2p !== 0) {
      if (Math.abs(h1p - h2p) > 180) avgHp += 360;
      avgHp /= 2;
    }

    const T =
      1 -
      0.17 * Math.cos(((avgHp - 30) * Math.PI) / 180) +
      0.24 * Math.cos((2 * avgHp * Math.PI) / 180) +
      0.32 * Math.cos(((3 * avgHp + 6) * Math.PI) / 180) -
      0.2 * Math.cos(((4 * avgHp - 63) * Math.PI) / 180);

    const dTheta = 30 * Math.exp((-((avgHp - 275) / 25)) ** 2);
    const Rc = 2 * Math.sqrt(avgCp ** 7 / (avgCp ** 7 + 25 ** 7));
    const Sl =
      1 + (0.015 * (avgLp - 50) ** 2) / Math.sqrt(20 + (avgLp - 50) ** 2);
    const Sc = 1 + 0.045 * avgCp;
    const Sh = 1 + 0.015 * avgCp * T;
    const Rt = -Math.sin((2 * dTheta * Math.PI) / 180) * Rc;

    return Math.sqrt(
      (dLp / Sl) ** 2 +
        (dCp / Sc) ** 2 +
        (dHp / Sh) ** 2 +
        Rt * (dCp / Sc) * (dHp / Sh)
    );
  }
}
