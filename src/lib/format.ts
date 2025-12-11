import * as yaml from "js-yaml";
import { Theme, ThemeColor } from "@/types/mcuc";
import { Utils } from "@/lib/utils";

export class Format {
  static generate(
    theme: Theme | { light?: ThemeColor; dark?: ThemeColor },
    fmt: string,
    prefix: string,
    casing: string,
  ): string {
    const processedTheme = this._transformThemeKeys(theme, prefix, casing);

    switch (fmt) {
      case "scss":
        return this._formatScss(processedTheme);
      case "less":
        return this._formatLess(processedTheme);
      case "styl":
        return this._formatStyl(processedTheme);
      case "css":
        return this._formatCss(processedTheme);
      case "json":
        return JSON.stringify(processedTheme, null, 2);
      case "ts":
        return `export const theme = ${JSON.stringify(
          processedTheme,
          null,
          2,
        )};`;
      case "js":
        return `const theme = ${JSON.stringify(
          processedTheme,
          null,
          2,
        )};\nexport { theme }`;
      case "xml":
        return this._formatXml(processedTheme);
      case "yaml":
        return yaml.dump(processedTheme);
      case "table":
        return this._formatTable(processedTheme);
      default:
        return `Unsupported format: ${fmt}`;
    }
  }

  static info(
    info: { hex: string; hct: { hue: number; chroma: number; tone: number } },
    fmt: string,
  ): string {
    switch (fmt) {
      case "json":
        return JSON.stringify(info, null, 2);
      case "yaml":
        return yaml.dump(info);
      case "table":
        console.table(info);
        return "";
      default:
        return `Unsupported format: ${fmt}`;
    }
  }

  static contrast(
    data:
      | { ratio: number; colorA: string; colorB: string; wcag: any }
      | { ratio: number; colorA: string; colorB: string; wcag: any }[],
    fmt: string,
    wcagOnly = false,
  ): string {
    const toDisplay = (d: any) =>
      wcagOnly
        ? {
            colorA: d.colorA,
            colorB: d.colorB,
            AA: d.wcag.AA ? "Pass" : "Fail",
            AA_Large: d.wcag.AA_Large ? "Pass" : "Fail",
            AAA: d.wcag.AAA ? "Pass" : "Fail",
            AAA_Large: d.wcag.AAA_Large ? "Pass" : "Fail",
          }
        : {
            ratio: d.ratio,
            colorA: d.colorA,
            colorB: d.colorB,
            AA: d.wcag.AA,
            AA_Large: d.wcag.AA_Large,
            AAA: d.wcag.AAA,
            AAA_Large: d.wcag.AAA_Large,
          };

    const normalized = Array.isArray(data)
      ? data.map(toDisplay)
      : [toDisplay(data)];

    switch (fmt) {
      case "json":
        return JSON.stringify(normalized, null, 2);
      case "yaml":
        return yaml.dump(normalized);
      case "table":
        console.table(normalized);
        return "";
      default:
        return `Unsupported format: ${fmt}`;
    }
  }

  static async preview(
    theme: { light?: ThemeColor; dark?: ThemeColor },
    usage: boolean,
  ): Promise<string> {
    const lightTheme = theme.light!;
    const darkTheme = theme.dark!;

    function renderColors(themeColors: ThemeColor, label: string) {
      return Object.entries(themeColors)
        .map(
          ([key, value]) =>
            `<div class="color-card">
            <div class="color-swatch" style="background-color: ${value};"></div>
            <div class="color-label">${label} - ${key}: ${value}</div>
          </div>`,
        )
        .join("\n");
    }

    function renderUsage(themeColors: ThemeColor) {
      if (!usage) return "";
      return `
      <h3>Text Examples</h3>
      <p style="color: ${themeColors.onBackground}">This is primary text</p>
      <p style="color: ${themeColors.onSurface}">This is secondary text</p>

      <h3>Buttons</h3>
      <button style="background-color: ${themeColors.primary}; color: ${themeColors.onPrimary}; padding: 0.5rem 1rem; border: none; border-radius: 4px; margin: 0.25rem;">Primary</button>
      <button style="background-color: ${themeColors.secondary}; color: ${themeColors.onSecondary}; padding: 0.5rem 1rem; border: none; border-radius: 4px; margin: 0.25rem;">Secondary</button>

      <h3>Cards</h3>
      <div style="background-color: ${themeColors.surfaceContainerHigh}; color: ${themeColors.onSurface}; padding: 1rem; border-radius: 8px; margin: 0.5rem 0;">Card Example</div>
    `;
    }

    const html = Utils.previewTemplate
      .replace("{{ LIGHT_BG }}", lightTheme.background)
      .replace("{{ LIGHT_ON_BG }}", lightTheme.onBackground)
      .replace("{{ LIGHT_OUTLINE }}", lightTheme.outline)
      .replace("{{ DARK_BG }}", darkTheme.background)
      .replace("{{ DARK_ON_BG }}", darkTheme.onBackground)
      .replace("{{ DARK_OUTLINE }}", darkTheme.outline)
      .replace("{{ LIGHT_COLORS }}", renderColors(lightTheme, "Light"))
      .replace("{{ DARK_COLORS }}", renderColors(darkTheme, "Dark"))
      .replace("{{ LIGHT_USAGE }}", renderUsage(lightTheme))
      .replace("{{ DARK_USAGE }}", renderUsage(darkTheme));

    return html;
  }

  private static _transformThemeKeys(
    theme: any,
    prefix: string,
    casing: string,
  ): any {
    const out: any = {};
    for (const scheme in theme) {
      out[scheme] = {};
      const colors = theme[scheme];
      for (const key in colors) {
        out[scheme][`${prefix}${Utils.toCase(key, casing)}`] = colors[key];
      }
    }
    return out;
  }

  private static _formatScss(theme: any): string {
    let out = "";

    for (const scheme in theme) {
      out += `@mixin ${scheme}-theme() {\n`;
      const colors = theme[scheme];
      for (const key in colors) {
        out += `  $${key}: ${colors[key]};\n`;
      }
      out += `}\n\n`;
    }

    return out.trim();
  }

  private static _formatLess(theme: any): string {
    let out = "";

    for (const scheme in theme) {
      out += `.${scheme}-theme() {\n`;
      const colors = theme[scheme];
      for (const key in colors) {
        out += `  @${key}: ${colors[key]};\n`;
      }
      out += `}\n\n`;
    }

    return out.trim();
  }

  private static _formatStyl(theme: any): string {
    let out = "";

    for (const scheme in theme) {
      out += `${scheme}-theme()\n`;
      const colors = theme[scheme];
      for (const key in colors) {
        out += `  ${key} = ${colors[key]}\n`;
      }
      out += `\n`;
    }

    return out.trim();
  }

  private static _formatCss(theme: any): string {
    let out = "";
    for (const scheme in theme) {
      const colors = theme[scheme];
      out += `.${scheme} {\n`;
      for (const key in colors) {
        out += `  --${key}: ${colors[key]};\n`;
      }
      out += "}\n";
    }
    return out.trim();
  }

  private static _formatXml(theme: any): string {
    let out = `<theme>\n`;
    for (const scheme in theme) {
      out += `  <${scheme}>\n`;
      const colors = theme[scheme];
      for (const key in colors) {
        out += `    <color name="${key}">${colors[key]}</color>\n`;
      }
      out += `  </${scheme}>\n`;
    }
    out += `</theme>`;
    return out;
  }

  private static _formatTable(theme: any): string {
    for (const scheme in theme) {
      console.log(`Scheme: ${scheme}`);
      console.table(theme[scheme]);
    }
    return "";
  }
}
