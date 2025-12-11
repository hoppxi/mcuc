import path from "path";
import { promises as fs } from "fs";
import { MaterialCli } from "@/lib/material-cli";
import { Format } from "@/lib/format";
import { Logger } from "@/lib/logger";
import { ThemeColor } from "@/types/mcuc";
import { PreviewOptions, PreviewInput } from "@/types/commands";

export async function preview(input: PreviewInput, opts: PreviewOptions) {
  const logger = new Logger(true);
  logger.enabled = opts.log;

  try {
    let seed: PreviewInput = input;
    if (opts.image) {
      const imgPath = path.resolve(opts.image);
      logger.info(`Loading image: ${imgPath}`);
      seed = await fs.readFile(imgPath);
    }
    if (!seed) {
      logger.error("No input color or image provided.");
      process.exit(1);
    }

    logger.info("Generating theme for preview...");
    const themeObj = await MaterialCli.generateTheme(seed, {
      theme: "both",
    });

    const html = await Format.preview(
      themeObj as { light?: ThemeColor; dark?: ThemeColor },
      opts.usage
    );

    if (opts.out) {
      await fs.writeFile(opts.out, html, "utf8");
      logger.success(`Preview HTML written to ${opts.out}`);
    } else {
      logger.success("Preview HTML output:");
      console.log(html);
    }
  } catch (err: any) {
    logger.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
