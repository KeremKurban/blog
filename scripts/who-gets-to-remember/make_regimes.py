"""Draws the three softmax regimes figure for the post "Who Gets to Remember?".

Run: python3 scripts/who-gets-to-remember/make_regimes.py
Writes public/posts/who-gets-to-remember/three-regimes.svg
"""
import math
from pathlib import Path

SCORES = {"A": 3.0, "B": 2.5, "C": 0.0}
PANELS = [(0.1, "Low β: global average"), (1.0, "Medium β: A and B blend"), (10.0, "High β: one winner")]
COLORS = {"A": "#ae4f2c", "B": "#d97757", "C": "#6f6b5e"}
INK, BODY, MUTED, RULE, PAPER = "#141413", "#3d3929", "#6f6b5e", "#dedcd1", "#faf9f5"
SANS = "Instrument Sans Variable, Instrument Sans, ui-sans-serif, system-ui, sans-serif"

W, H = 900, 360
PW, PH = 250, 200   # plot area per panel
X0, Y0 = 60, 70     # first panel origin (top-left of plot area)
GAP = 50


def softmax(beta):
    m = max(SCORES.values())
    e = {k: math.exp(beta * (v - m)) for k, v in SCORES.items()}
    z = sum(e.values())
    return {k: v / z for k, v in e.items()}


parts = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" '
    'aria-label="Attention weights on three memories at low, medium and high beta">',
    f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
]
for i, (beta, title) in enumerate(PANELS):
    x = X0 + i * (PW + GAP)
    p = softmax(beta)
    parts.append(f'<text x="{x}" y="40" font-family="{SANS}" font-size="16" font-weight="600" fill="{INK}">{title}</text>')
    for t in (0, 0.5, 1.0):
        y = Y0 + PH - t * PH
        parts.append(f'<line x1="{x}" y1="{y:.1f}" x2="{x + PW}" y2="{y:.1f}" stroke="{RULE}" stroke-width="1"/>')
        if i == 0:
            parts.append(f'<text x="{x - 10}" y="{y + 4:.1f}" font-family="{SANS}" font-size="12" fill="{MUTED}" text-anchor="end">{t:.1f}</text>')
    bw = 52
    for j, k in enumerate(SCORES):
        bx = x + 22 + j * (bw + 30)
        bh = p[k] * PH
        parts.append(f'<rect x="{bx}" y="{Y0 + PH - bh:.1f}" width="{bw}" height="{bh:.1f}" fill="{COLORS[k]}"/>')
        parts.append(f'<text x="{bx + bw / 2}" y="{Y0 + PH - bh - 8:.1f}" font-family="{SANS}" font-size="13" fill="{BODY}" text-anchor="middle">{p[k]:.2f}</text>')
        parts.append(f'<text x="{bx + bw / 2}" y="{Y0 + PH + 22}" font-family="{SANS}" font-size="14" font-weight="600" fill="{INK}" text-anchor="middle">{k}</text>')
parts.append(f'<text x="{X0 - 48}" y="{Y0 + PH / 2}" font-family="{SANS}" font-size="12" fill="{MUTED}" transform="rotate(-90 {X0 - 48} {Y0 + PH / 2})" text-anchor="middle">Weight</text>')
parts.append(f'<text x="{X0}" y="{H - 20}" font-family="{SANS}" font-size="13" fill="{MUTED}">Similarity scores: A = 3, B = 2.5 (related to A), C = 0 (unrelated). Weights = softmax(β × score).</text>')
parts.append("</svg>")

out = Path(__file__).resolve().parents[2] / "public/posts/who-gets-to-remember/three-regimes.svg"
out.write_text("\n".join(parts) + "\n")
print("wrote", out)
