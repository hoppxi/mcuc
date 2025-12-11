import { Command } from "commander";
import { generate } from "@/cmd/generate";
import { info } from "@/cmd/info";
import { contrast } from "@/cmd/contrast";
import { preview } from "@/cmd/preview";
import pkg from "$/package.json";

const program = new Command();

program
  .name("mcuc")
  .description(
    "Material Color Utilities CLI - Generate and inspect Material 3 color themes"
  )
  .version(pkg.version)
  .showHelpAfterError()
  .enablePositionalOptions();

program.addHelpText(
  "after",
  `
Examples:
  $ mcuc generate "#ff0000" -f css
  $ mcuc info ./image.png --extended
  $ mcuc contrast "#000" "#fff" -w
  $ mcuc preview "#2196f3" -o theme.html
`
);

program
  .command("generate")
  .description("Generate Material 3 theme from a color or image")
  .argument("[input]", "Hex color (#RRGGBB) or image file path")
  .option("-o, --out <file>", "Write output to file instead of stdout")
  .option(
    "-p, --palette",
    "Generate full tonal palette instead of theme",
    false
  )
  .option(
    "-f, --format <fmt>",
    "Output format: json|table|yaml|css|scss|less|styl|js|ts|xml",
    "json"
  )
  .option("-P, --prefix <prefix>", "Prefix for variable names", "")
  .option("-C, --case <style>", "Variable casing: camel|pascal|kebab", "kebab")
  .option("-r, --random", "Use random color instead of input", false)
  .option(
    "-i, --image <img>",
    "Extract dominant color from image, overrides input"
  )
  .option("-T, --theme <theme>", "Theme: light|dark|both", "dark")
  .option("--hue <val>", "Hue override (0-360)", (v) => Number(v))
  .option("--chroma <val>", "Chroma override (0-150)", (v) => Number(v))
  .option("--tone <val>", "Tone override (0-100)", (v) => Number(v))
  .option("-l, --log", "Enable detailed logging for progress", false)
  .action(async (input, opts) => {
    await generate(input, opts);
  });

program
  .command("info")
  .description("Show color info for a hex color or image")
  .argument("[input]", "Hex color (#RRGGBB) or image file path")
  .option(
    "-i, --image <img>",
    "Extract dominant color from image, overrides input"
  )
  .option("-f, --format <fmt>", "Output format: json|table|yaml", "json")
  .option(
    "-e, --extended",
    "Show extended color info (LAB, LCH, OKLCH, luminance)",
    false
  )
  .option(
    "-d, --distance <color>",
    "Compare input color to another color and show ΔE (color difference)"
  )
  .option("-l, --log", "Enable detailed logging for progress", false)
  .action(async (input, opts) => {
    await info(input, opts);
  });

program
  .command("contrast")
  .description("Check contrast ratio between two hex colors")
  .argument("[input...]", "Two hex colors (#RRGGBB #RRGGBB)")
  .option("-f, --format <fmt>", "Output format: json|table|yaml", "json")
  .option("-b, --bg <color...>", "Background color(s) to test against")
  .option("-w, --wcag-only", "Output only WCAG compliance levels", false)
  .option("-l, --log", "Enable detailed logging for progress", false)
  .action(async (input, opts) => {
    await contrast(input, opts);
  });

program
  .command("preview")
  .description("Generate an HTML preview of a theme from a color or image")
  .argument("[input]", "Hex color (#RRGGBB) or image file path")
  .option("-o, --out <file>", "Write preview HTML to file instead of stdout")
  .option(
    "-i, --image <img>",
    "Extract dominant color from image, overrides input"
  )
  .option(
    "-u, --usage",
    "Include example usage components (text, buttons, cards)"
  )
  .option("-l, --log", "Enable detailed logging for progress", false)
  .action(async (input, opts) => {
    await preview(input, opts);
  });

program.parse(process.argv);
