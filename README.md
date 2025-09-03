# mcuc

A command-line tool for Material Color Utilities, packaged with npm and Nix flakes.  
Quickly access Material Color Utilities from the terminal.  
Reproducible builds using [Nix flakes](https://nixos.org/manual/nix/unstable/command-ref/new-cli/nix3-flake.html).

## Installation

### As a Node.js/npm project

```sh
git clone https://github.com/hoppxi/mcuc.git
cd mcuc
npm install
npm run build

./dist/bin/mcuc.js [options] <command>
```

### With Nix flakes

```sh
nix build
# or
nix run github:hoppxi/mcuc
```

The resulting binary will be in `./result/bin/mcuc`.

## Usage

```sh
./result/bin/mcuc [options] <command>
```

### Example: Generate Theme

```sh
mcuc info "#abcdef"
  # -i, --image <img>       Extract dominant color from image, overrides input
  # -f, --format <fmt>      Output format: json|table|yaml (default: "json")
  # -e, --extended          Show extended color info (LAB, LCH, OKLCH, luminance) (default: false)
  # -d, --distance <color>  Compare input color to another color and show ΔE (color difference)

mcuc generate "#abcdef"
  # -o, --out <file>       Write output to file instead of stdout
  # -p, --palette          Generate full tonal palette instead of theme (default: false)
  # -f, --format <fmt>     Output format: json|table|yaml|css|scss|less|styl|js|ts|xml (default: "json")
  # -P, --prefix <prefix>  Prefix for variable names (default: "")
  # -C, --case <style>     Variable casing: camel|pascal|kebab (default: "kebab")
  # -r, --random           Use random color instead of input (default: false)
  # -i, --image <img>      Extract dominant color from image, overrides input
  # -T, --theme <theme>    Theme: light|dark|both (default: "dark")
  # --hue <val>            Hue override (0-360)
  # --chroma <val>         Chroma override (0-150)
  # --tone <val>           Tone override (0-100)


```

Example

```sh
./dist/bin/mcuc.js generate --random -f css -T both # -p for palette or image path for extracting from image and hex color to get generate from it.

```

```css
.light {
  --primary: #7b5800;
  --on-primary: #ffffff;
  --primary-container: #ffdea6;
  --on-primary-container: #271900;
  ...
}
.dark {
  --primary: #f7bd48;
  --on-primary: #412d00;
  --primary-container: #5d4200;
  --on-primary-container: #ffdea6;
  ...
}
....
```

### Supported Formats

- `json`
- `yaml`
- `scss`, `less`, `styl`, `css`, `html`, `ts`, `js`, `xml`, `table`

### Preview

You can generate an HTML preview of the theme using the `previewTemplate` from `Utils`. It renders light/dark color cards and usage examples directly in a browser.

## Development

To enter a development shell with Node.js and npm available:

```sh
nix develop
```

### Using in other flake projects

You can add mcuc as an input in another flake:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    mcuc.url = "github:hoppxi/mcuc";
  };

  outputs = { self, nixpkgs, mcuc, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      packages.default = pkgs.mkShell {
        buildInputs = [
          mcuc.packages.${system}.default
        ];
      };
    };
}
```

```sh
nix develop
mcuc --help
```

## License

MIT (see [LICENSE](LICENSE))
