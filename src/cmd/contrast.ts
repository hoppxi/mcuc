import { MaterialCli } from "@/lib/material-cli";
import { Format } from "@/lib/format";
import { Logger } from "@/lib/logger";
import { ContrastOptions, ContrastInput } from "@/types/commands";

export async function contrast(inputs: ContrastInput, opts: ContrastOptions) {
  const logger = new Logger(true);
  logger.enabled = opts.log;

  try {
    if (opts.bg && inputs.length === 1) {
      const fg = inputs[0];
      const results = opts.bg.map((bg: string) =>
        MaterialCli.contrastRatio(fg, bg)
      );

      const formatted = Format.contrast(results, opts.format, opts.wcagOnly);
      logger.success("Contrast against backgrounds:");
      console.log(formatted);
      return;
    }

    if (!inputs || inputs.length !== 2) {
      logger.error("Contrast requires two colors or one color with --bg.");
      process.exit(1);
    }

    const result = MaterialCli.contrastRatio(inputs[0], inputs[1]);
    const formatted = Format.contrast(result, opts.format, opts.wcagOnly);
    logger.success("Contrast output:");
    console.log(formatted);
  } catch (err: any) {
    logger.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
