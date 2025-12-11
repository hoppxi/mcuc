import path from "path";
import { promises as fs } from "fs";
import { Logger } from "@/lib/logger";
import { Utils } from "@/lib/utils";
import { MaterialCli } from "@/lib/material-cli";
import { Format } from "@/lib/format";
import { InfoOptions, InfoInput } from "@/types/commands";

export async function info(input: InfoInput, opts: InfoOptions) {
  const logger = new Logger(true);
  logger.enabled = opts.log;

  try {
    let colorSeed: InfoInput = input;
    if (opts.image) {
      const imgPath = path.resolve(opts.image);
      logger.info(`Loading image: ${imgPath}`);
      const imageBuffer = await fs.readFile(imgPath);
      colorSeed = await Utils.getDominantColorHex(imageBuffer);
    }
    if (!colorSeed) {
      logger.error("No input color or image provided.");
      process.exit(1);
    }

    const info = await MaterialCli.colorInfo(colorSeed, {
      extended: opts.extended,
      distance: opts.distance,
    });

    const formatted = Format.info(info, opts.format);
    logger.success("Color info output:");
    console.log(formatted);
  } catch (err: any) {
    logger.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
