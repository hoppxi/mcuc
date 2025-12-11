import {
  themeFromSourceColor,
  themeFromImage,
  argbFromHex,
  hexFromArgb,
  Theme,
  Hct,
} from "@material/material-color-utilities";
import { Contrast } from "@/lib/contrast";
import { Theme as Themed, ThemeColor } from "@/types/mcuc";
import { Utils } from "@/lib/utils";

export class MaterialCli {
  static async generatePalette(
    source: string | Buffer,
    opts: {
      hue?: number;
      chroma?: number;
      tone?: number;
      theme?: "light" | "dark" | "both";
    } = {}
  ): Promise<{
    light?: Record<string, string[]>;
    dark?: Record<string, string[]>;
  } | null> {
    let themeObj: Theme | null = null;

    if (typeof source === "string") {
      let seed = argbFromHex(source);
      if (
        opts.hue !== undefined ||
        opts.chroma !== undefined ||
        opts.tone !== undefined
      ) {
        const hct = Hct.fromInt(seed);
        if (opts.hue !== undefined) hct.hue = opts.hue;
        if (opts.chroma !== undefined) hct.chroma = opts.chroma;
        if (opts.tone !== undefined) hct.tone = opts.tone;
        seed = hct.toInt();
      }
      themeObj = themeFromSourceColor(seed);
    } else {
      // Image buffer
      const hex = await this._getDominantColorHex(source);
      const seed = argbFromHex(hex);
      themeObj = themeFromSourceColor(seed);
    }

    if (!themeObj) return null;

    const mapped = MaterialCli.mapTheme(themeObj);

    function generateTones(scheme: any): Record<string, string[]> {
      const tones: Record<string, string[]> = {};
      const roles = [
        "primary",
        "secondary",
        "tertiary",
        "error",
        "background",
        "surface",
      ];

      for (const role of roles) {
        const value = scheme[role];
        const hct = Hct.fromInt(argbFromHex(value));
        // Generate tones 0–100 in increments of 10
        const roleTones: string[] = [];
        for (let t = 0; t <= 100; t += 10) {
          const toneColor = Hct.from(hct.hue, hct.chroma, t);
          roleTones.push(hexFromArgb(toneColor.toInt()));
        }
        tones[role] = roleTones;
      }

      return tones;
    }

    const result: {
      light?: Record<string, string[]>;
      dark?: Record<string, string[]>;
    } = {};
    if (opts.theme === "light" || opts.theme === "both")
      result.light = generateTones(mapped.light);
    if (opts.theme === "dark" || opts.theme === "both")
      result.dark = generateTones(mapped.dark);

    return result;
  }

  static async generateTheme(
    source: string | Buffer,
    opts: {
      hue?: number;
      chroma?: number;
      tone?: number;
      theme?: "light" | "dark" | "both";
    } = {}
  ): Promise<Theme | { light?: ThemeColor; dark?: ThemeColor } | null> {
    let theme: Theme;
    let seed: number;
    if (typeof source === "string") {
      seed = argbFromHex(source);
      if (opts.hue || opts.chroma || opts.tone) {
        const hct = Hct.fromInt(seed);
        if (opts.hue !== undefined) hct.hue = opts.hue;
        if (opts.chroma !== undefined) hct.chroma = opts.chroma;
        if (opts.tone !== undefined) hct.tone = opts.tone;
        seed = hct.toInt();
      }
      theme = themeFromSourceColor(seed);
    } else {
      // Image buffer: extract dominant color, then make theme
      const hex = await this._getDominantColorHex(source);
      seed = argbFromHex(hex);
      theme = themeFromSourceColor(seed);
    }
    const mapped = MaterialCli.mapTheme(theme);
    if (opts.theme === "light") return { light: mapped.light };
    if (opts.theme === "dark") return { dark: mapped.dark };
    return mapped;
  }

  static async colorInfo(
    source: string | Buffer,
    opts?: { extended?: boolean; distance?: string }
  ): Promise<any> {
    let color: number;
    if (typeof source === "string") {
      color = argbFromHex(source);
    } else {
      const theme = await themeFromImage(new Uint8Array(source));
      color = theme.source;
    }

    const hex = hexFromArgb(color);
    const hct = Hct.fromInt(color);
    const result: any = {
      hex,
      hct: {
        hue: Number(hct.hue.toFixed(2)),
        chroma: Number(hct.chroma.toFixed(2)),
        tone: Number(hct.tone.toFixed(2)),
      },
    };

    if (opts?.extended) {
      const [r, g, b] = Utils.hexToRgb(hex);
      const lab = Utils.rgbToLab(r, g, b);
      const lch = Utils.labToLch(lab);
      const oklch = Utils.rgbToOklch(r, g, b);
      const luminance = Utils.relativeLuminance(r, g, b);

      result.extended = { lab, lch, oklch, luminance };
    }

    if (opts?.distance) {
      const target = argbFromHex(opts.distance);
      const targetHex = hexFromArgb(target);
      const [r1, g1, b1] = Utils.hexToRgb(hex);
      const [r2, g2, b2] = Utils.hexToRgb(targetHex);

      const lab1 = Utils.rgbToLab(r1, g1, b1);
      const lab2 = Utils.rgbToLab(r2, g2, b2);

      result.distance = {
        target: targetHex,
        deltaE76: Utils.deltaE76(lab1, lab2),
        deltaE00: Utils.deltaE00(lab1, lab2),
      };
    }

    return result;
  }

  static contrastRatio(
    colorA: string,
    colorB: string
  ): {
    ratio: number;
    colorA: string;
    colorB: string;
    wcag: { AA: boolean; AA_Large: boolean; AAA: boolean; AAA_Large: boolean };
  } {
    const a = argbFromHex(colorA);
    const b = argbFromHex(colorB);
    const ratio = Number(Contrast.ratio(a, b).toFixed(3));

    return {
      ratio,
      colorA,
      colorB,
      wcag: {
        AA: ratio >= 4.5,
        AA_Large: ratio >= 3.0,
        AAA: ratio >= 7.0,
        AAA_Large: ratio >= 4.5,
      },
    };
  }

  static mapTheme(theme: Theme): Themed {
    const map = (scheme: any, palettes: any, light: boolean): ThemeColor => ({
      primary: hexFromArgb(scheme.primary),
      onPrimary: hexFromArgb(scheme.onPrimary),
      primaryContainer: hexFromArgb(scheme.primaryContainer),
      onPrimaryContainer: hexFromArgb(scheme.onPrimaryContainer),
      secondary: hexFromArgb(scheme.secondary),
      onSecondary: hexFromArgb(scheme.onSecondary),
      secondaryContainer: hexFromArgb(scheme.secondaryContainer),
      onSecondaryContainer: hexFromArgb(scheme.onSecondaryContainer),
      tertiary: hexFromArgb(scheme.tertiary),
      onTertiary: hexFromArgb(scheme.onTertiary),
      tertiaryContainer: hexFromArgb(scheme.tertiaryContainer),
      onTertiaryContainer: hexFromArgb(scheme.onTertiaryContainer),
      error: hexFromArgb(scheme.error),
      onError: hexFromArgb(scheme.onError),
      errorContainer: hexFromArgb(scheme.errorContainer),
      onErrorContainer: hexFromArgb(scheme.onErrorContainer),
      background: hexFromArgb(scheme.background),
      onBackground: hexFromArgb(scheme.onBackground),
      surface: hexFromArgb(scheme.surface),
      onSurface: hexFromArgb(scheme.onSurface),
      surfaceVariant: hexFromArgb(scheme.surfaceVariant),
      onSurfaceVariant: hexFromArgb(scheme.onSurfaceVariant),
      outline: hexFromArgb(scheme.outline),
      outlineVariant: hexFromArgb(
        light
          ? palettes.neutralVariant.tone(80)
          : palettes.neutralVariant.tone(30)
      ),
      shadow: hexFromArgb(scheme.shadow),
      scrim: hexFromArgb(scheme.scrim),
      inverseSurface: hexFromArgb(scheme.inverseSurface),
      inverseOnSurface: hexFromArgb(scheme.inverseOnSurface),
      inversePrimary: hexFromArgb(scheme.inversePrimary),
      surfaceTint: hexFromArgb(
        light ? palettes.neutral.tone(40) : palettes.neutral.tone(80)
      ),
      surfaceDim: hexFromArgb(
        light ? palettes.neutral.tone(87) : palettes.neutral.tone(6)
      ),
      surfaceBright: hexFromArgb(
        light ? palettes.neutral.tone(98) : palettes.neutral.tone(24)
      ),
      surfaceContainerLowest: hexFromArgb(
        light ? palettes.neutral.tone(100) : palettes.neutral.tone(4)
      ),
      surfaceContainerLow: hexFromArgb(
        light ? palettes.neutral.tone(96) : palettes.neutral.tone(10)
      ),
      surfaceContainer: hexFromArgb(
        light ? palettes.neutral.tone(94) : palettes.neutral.tone(12)
      ),
      surfaceContainerHigh: hexFromArgb(
        light ? palettes.neutral.tone(92) : palettes.neutral.tone(17)
      ),
      surfaceContainerHighest: hexFromArgb(
        light ? palettes.neutral.tone(90) : palettes.neutral.tone(22)
      ),
    });

    return {
      light: map(theme.schemes.light, theme.palettes, true),
      dark: map(theme.schemes.dark, theme.palettes, false),
    };
  }

  private static _getDominantColorHex = Utils.getDominantColorHex;
}
