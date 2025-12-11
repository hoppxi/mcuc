import path from "path";
import { promises as fs } from "fs";
import { Logger } from "@/lib/logger";
import { Utils } from "@/lib/utils";
import { MaterialCli } from "@/lib/material-cli";
import { Format } from "@/lib/format";
import { Theme, ThemeColor } from "@/types/mcuc";
import { GenerateOptions, GenerateInput } from "@/types/commands";

export async function generate(input: GenerateInput, opts: GenerateOptions) {
  const logger = new Logger(true);
  logger.enabled = opts.log;
  logger.info(`Material 3 Theme Generator v${process.env.npm_package_version}`);

  try {
    let seed: GenerateInput = input;

    if (opts.image) {
      const imgPath = path.resolve(opts.image);
      logger.info(`Loading image: ${imgPath}`);
      seed = await fs.readFile(imgPath);
    } else if (opts.random) {
      seed = Utils.randomHexColor();
      logger.info(`Generated random seed color: ${seed}`);
    }

    if (!seed) {
      logger.error("No input color or image provided.");
      process.exit(1);
    }

    logger.info(opts.palette ? "Generating palette..." : "Generating theme...");

    const result = opts.palette
      ? await MaterialCli.generatePalette(seed, {
          hue: opts.hue,
          chroma: opts.chroma,
          tone: opts.tone,
          theme: opts.theme,
        })
      : await MaterialCli.generateTheme(seed, {
          hue: opts.hue,
          chroma: opts.chroma,
          tone: opts.tone,
          theme: opts.theme,
        });

    if (!result) {
      logger.error(`Failed to generate ${opts.palette ? "palette" : "theme"}.`);
      process.exit(1);
    }

    const formatted = Format.generate(
      result as Theme | { light?: ThemeColor; dark?: ThemeColor },
      opts.format,
      opts.prefix,
      opts.case
    );

    if (opts.out) {
      await fs.writeFile(opts.out, formatted, "utf8");
      logger.success(
        `${opts.palette ? "Palette" : "Theme"} written to ${opts.out}`
      );
    } else {
      logger.success(`${opts.palette ? "Palette" : "Theme"} output:`);
      console.log(formatted);
    }
  } catch (err: any) {
    logger.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
