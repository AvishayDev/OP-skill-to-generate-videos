#!/usr/bin/env bash
# Pixel-only guard: refuse a painting that makes its picture any way other than pixel(x, y, t).
#   check.sh <Painting.java>   → exit 0 when clean, 1 with the offending lines otherwise
# Allowed: math, Color, Paint, Lettering (text as a distance), Picture (a file sampled per pixel), java.awt.Font.
# Refused: a camera, scene, geometry primitives, rays or lights (no ray tracing), any drawing API (Graphics,
# Graphics2D, shapes, fills, drawString/drawImage, BufferedImage, ImageIO, Swing/JavaFX/Canvas), touching the
# ImageWriter directly, and running other programs to make frames.
set -euo pipefail
SRC="$1"
# drop comments and string/char literals first, so words in a title or a comment don't count
CODE="$(perl -0777 -pe 's{/\*(.*?)\*/}{"\n" x ($1 =~ tr/\n//)}gse; s{//[^\n]*}{}g; s{"(?:\\.|[^"\\\n])*"}{""}g; s{'"'"'(?:\\.|[^'"'"'\\\n])+'"'"'}{'"''"'}g' "$SRC")"
BAD='\b(Camera|Scene|Geometry|Geometries|Intersectable|Sphere|Plane|Triangle|Polygon|Cylinder|Tube|Ray|RayTracer|RayTracerBasic|LightSource|PointLight|SpotLight|DirectionalLight|AmbientLight|Material|Graphics|Graphics2D|BufferedImage|ImageIO|Raster|WritableRaster|AlphaComposite|GradientPaint|Ellipse2D|Rectangle2D|RoundRectangle2D|Path2D|GeneralPath|Area|AffineTransform|Canvas|JFrame|JPanel|ImageWriter|ProcessBuilder|Runtime)\b|\b(java\.awt\.(?!Font\b)[A-Za-z.]+|javax\.[a-z.]+|javafx\.[a-z.]+)|\.(drawString|drawImage|drawLine|drawRect|drawOval|drawPolygon|fillRect|fillOval|fillPolygon|fillRoundRect|fill|draw|setRGB|setPixel|setPixels|getGraphics|createGraphics)\s*\('
HITS="$(printf '%s\n' "$CODE" | grep -nP "$BAD" || true)"
if [ -n "$HITS" ]; then
  echo "image-writer: $SRC is not pixel-only. Every color must come from pixel(x, y, t) — no camera, scene," >&2
  echo "geometry, rays, lights, drawing calls or other renderers. Use math distances, Lettering and Picture:" >&2
  printf '%s\n' "$HITS" | sed 's/^/  line /' >&2
  exit 1
fi
