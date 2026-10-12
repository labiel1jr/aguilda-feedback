"""Copia e otimiza as artes do jogo usadas na página de feedback.

Uso: python tools/copiar_artes.py <pasta do repositório AGuilda>
Grava em assets/: WebP para as imagens grandes, PNG para as peças pequenas (botões, ícones, selos).
"""
import sys
from pathlib import Path

from PIL import Image

HEROIS = ["theo", "lyssa", "mira", "senna", "bram", "vera", "corin", "halvard"]

# (origem no jogo, destino em assets/, largura máxima ou None para manter)
GRANDES = [
    ("art/geralimagem/titulo.png", "titulo.webp", 1280),
    ("art/backgrounds/salao.png", "salao.webp", 1280),
    ("art/guild/quadro_avisos.png", "quadro.webp", None),
] + [(f"art/portraits/{h}.png", f"herois/{h}.webp", 192) for h in HEROIS]

PEQUENAS = [
    "art/ui/btn_madeira_normal.png", "art/ui/btn_pergaminho_normal.png", "art/ui/btn_escolha_normal.png",
    "art/ui/btn_perigo_normal.png", "art/guild/prego_ferro.png", "art/guild/selo_comum.png",
    "art/guild/selo_pessoal.png", "art/guild/selo_lendario.png", "art/guild/selo_urgente.png",
    "art/ui/icones/confirmar.png", "art/ui/icones/conversar.png", "art/ui/icones/ver_detalhes.png",
    "art/ui/icones/voltar.png", "art/ui/icones/continuar.png",
]


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    jogo = Path(sys.argv[1])
    out = Path(__file__).resolve().parent.parent / "assets"
    (out / "herois").mkdir(parents=True, exist_ok=True)
    for src, dst, largura in GRANDES:
        im = Image.open(jogo / src)
        if largura and im.width > largura:
            im = im.resize((largura, round(im.height * largura / im.width)), Image.LANCZOS)
        im.save(out / dst, "WEBP", quality=82, method=6)
    for src in PEQUENAS:
        Image.open(jogo / src).save(out / Path(src).name, optimize=True)
    icone = Image.open(jogo / "art/icon/icone_mestre.png")
    icone.resize((192, 192), Image.LANCZOS).save(out / "icone_192.png", optimize=True)
    icone.resize((48, 48), Image.LANCZOS).save(out / "favicon.png", optimize=True)
    total = sum(f.stat().st_size for f in out.rglob("*") if f.is_file())
    print(f"assets/: {total // 1024} KB")


if __name__ == "__main__":
    main()
