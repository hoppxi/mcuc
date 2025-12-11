{
  pkgs ? import <nixpkgs> { },
  lib,
}:

pkgs.buildNpmPackage {
  pname = "mcuc";
  version = "1.1.0";

  src = ./.;

  npmDepsHash = lib.fakeHash;

  npmBuild = "run build";

  nativeBuildInputs = with pkgs; [
    makeWrapper
    jq
  ];

  installPhase = ''
    runHook preInstall

    mkdir -p $out/lib/node_modules/mcuc
    cp -r dist package.json node_modules $out/lib/node_modules/mcuc

    mkdir -p $out/bin
    for binPath in $(jq -r '.bin | to_entries[] | "\(.key)=\(.value)"' package.json); do
      name=''${binPath%=*}
      target=''${binPath#*=}
      makeWrapper ${pkgs.nodejs}/bin/node $out/bin/$name \
        --add-flags "$out/lib/node_modules/mcuc/$target" \
        --set NODE_PATH "$out/lib/node_modules/mcuc/node_modules:$out/lib/node_modules"
    done

    mkdir -p $out/share/man/man1
    cp docs/man/mcuc.1 $out/share/man/man1/

    runHook postInstall
  '';

  meta = with pkgs.lib; {
    description = "Material Color Utilities Wrapper CLI";
    license = licenses.mit;
    maintainers = with maintainers; [ hoppxi ];
    platforms = platforms.all;
    mainProgram = "mcuc";
  };
}
