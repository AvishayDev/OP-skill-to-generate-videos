package imagewriter;

/**
 * An RGB color with double components on the 0..255 scale. Components may go above 255 while colors are
 * added together (light, glow); they are clamped only when a pixel is written.
 * Same API as Mini-Pro's Color, plus lerp and an alpha-free hex constructor.
 */
public final class Color {
    public static final Color BLACK = new Color(0, 0, 0);
    public static final Color WHITE = new Color(255, 255, 255);

    public final double r, g, b;

    public Color(double r, double g, double b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    /**
     * @param hex "#RRGGBB" or "RRGGBB"
     */
    public static Color hex(String hex) {
        int v = Integer.parseInt(hex.replace("#", ""), 16);
        return new Color((v >> 16) & 255, (v >> 8) & 255, v & 255);
    }

    public Color add(Color... colors) {
        double rr = r, gg = g, bb = b;
        for (Color c : colors) {
            rr += c.r;
            gg += c.g;
            bb += c.b;
        }
        return new Color(rr, gg, bb);
    }

    public Color scale(double k) {
        return new Color(r * k, g * k, b * k);
    }

    /**
     * Component-wise product with another color on the 0..255 scale (tinting)
     */
    public Color tint(Color c) {
        return new Color(r * c.r / 255, g * c.g / 255, b * c.b / 255);
    }

    /**
     * @return this color at t = 0, other at t = 1
     */
    public Color lerp(Color other, double t) {
        return new Color(r + (other.r - r) * t, g + (other.g - g) * t, b + (other.b - b) * t);
    }

    /**
     * @return the color clamped to 0..255 as a packed RGB int
     */
    public int rgb() {
        return (clamp(r) << 16) | (clamp(g) << 8) | clamp(b);
    }

    private static int clamp(double v) {
        return v <= 0 ? 0 : v >= 255 ? 255 : (int) v;
    }
}
