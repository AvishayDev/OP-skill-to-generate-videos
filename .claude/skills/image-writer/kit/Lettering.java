package imagewriter;

import java.awt.Font;
import java.awt.FontFormatException;
import java.awt.Shape;
import java.awt.font.FontRenderContext;
import java.awt.font.TextLayout;
import java.awt.geom.AffineTransform;
import java.awt.geom.PathIterator;
import java.awt.geom.Rectangle2D;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Text as a shape you paint pixel by pixel. The font file is only read for its letter outlines (the curves,
 * laid out right-to-left for Hebrew and Arabic); nothing is drawn. The outlines become a signed distance field,
 * so in pixel() a letter is just a distance like circle() or roundBox(): coverage(distance) fills it with soft
 * edges, exp(-distance / size) makes a glow, distance - k makes it bolder, an outline is |distance| - k.
 * Build it once in setup(); distance() is read-only and safe from several threads.
 */
public final class Lettering {
    /**
     * the visible bounds of the letters in frame pixels
     */
    public final double left, top, right, bottom, centerX, centerY;
    /**
     * the font size in pixels the letters ended up at (pass it to sized() to match other words)
     */
    public final double size;
    private final int x0, y0, gw, gh;
    private final float[] field;

    /**
     * Load a TrueType font file for its outlines, falling back to a bold system font if it is missing
     */
    public static Font font(String path) {
        try {
            if (path != null) return Font.createFont(Font.TRUETYPE_FONT, new File(path)).deriveFont(100f);
        } catch (FontFormatException | IOException ignored) {
        }
        return new Font("DejaVu Sans", Font.BOLD, 100);
    }

    /**
     * @param text    the words (any script)
     * @param font    from font()
     * @param width   the width of the visible letters in pixels
     * @param centerX where the center of the letters goes
     * @param centerY where the center of the letters goes
     * @param reach   how far from the letters distance() stays exact, in pixels (the widest glow or shadow)
     */
    public Lettering(String text, Font font, double width, double centerX, double centerY, double reach) {
        Shape outline = new TextLayout(text, font, new FontRenderContext(null, true, true)).getOutline(null);
        Rectangle2D b = outline.getBounds2D();
        double k = width / b.getWidth();
        AffineTransform place = new AffineTransform();
        place.translate(centerX, centerY);
        place.scale(k, k);
        place.translate(-b.getCenterX(), -b.getCenterY());
        this.centerX = centerX;
        this.centerY = centerY;
        size = k * font.getSize2D();
        left = centerX - width / 2;
        right = centerX + width / 2;
        top = centerY - k * b.getHeight() / 2;
        bottom = centerY + k * b.getHeight() / 2;

        double[] edges = edges(outline, place);
        x0 = (int) Math.floor(left - reach - 2);
        y0 = (int) Math.floor(top - reach - 2);
        gw = (int) Math.ceil(right + reach + 2) - x0 + 1;
        gh = (int) Math.ceil(bottom + reach + 2) - y0 + 1;
        field = new float[gw * gh];
        build(edges);
    }

    /**
     * The same, sized by the font size in pixels instead of a width - so several words share one size
     */
    public static Lettering sized(String text, Font font, double size, double centerX, double centerY, double reach) {
        double w = new TextLayout(text, font, new FontRenderContext(null, true, true)).getOutline(null)
                .getBounds2D().getWidth();
        return new Lettering(text, font, w * size / font.getSize2D(), centerX, centerY, reach);
    }

    /**
     * Signed distance in pixels from (x, y) to the letters' edge, negative inside
     */
    public double distance(double x, double y) {
        double gx = x - x0, gy = y - y0;
        if (gx < 0 || gy < 0 || gx > gw - 1 || gy > gh - 1) { // beyond reach: the nearest edge of the field + the way there
            double cx = Paint.clamp(gx, 0, gw - 1), cy = Paint.clamp(gy, 0, gh - 1);
            return distance(x0 + cx, y0 + cy) + Math.hypot(gx - cx, gy - cy);
        }
        int i = Math.min((int) gx, gw - 2), j = Math.min((int) gy, gh - 2);
        double fx = gx - i, fy = gy - j;
        int p = j * gw + i;
        double upper = field[p] + (field[p + 1] - field[p]) * fx;
        double lower = field[p + gw] + (field[p + gw + 1] - field[p + gw]) * fx;
        return upper + (lower - upper) * fy;
    }

    /**
     * The distance with the letters moved by (shiftX, shiftY) and scaled around their center - for motion
     */
    public double distance(double x, double y, double shiftX, double shiftY, double scale) {
        return scale * distance(centerX + (x - centerX - shiftX) / scale, centerY + (y - centerY - shiftY) / scale);
    }

    /**
     * The outline as straight edges ax, ay, bx, by, ... in frame pixels
     */
    private static double[] edges(Shape outline, AffineTransform place) {
        List<double[]> list = new ArrayList<>();
        double[] c = new double[6];
        double sx = 0, sy = 0, px = 0, py = 0;
        for (PathIterator it = outline.getPathIterator(place, 0.05); !it.isDone(); it.next()) {
            switch (it.currentSegment(c)) {
                case PathIterator.SEG_MOVETO -> {
                    sx = px = c[0];
                    sy = py = c[1];
                }
                case PathIterator.SEG_LINETO -> {
                    list.add(new double[]{px, py, c[0], c[1]});
                    px = c[0];
                    py = c[1];
                }
                case PathIterator.SEG_CLOSE -> {
                    if (px != sx || py != sy) list.add(new double[]{px, py, sx, sy});
                    px = sx;
                    py = sy;
                }
                default -> {
                }
            }
        }
        double[] edges = new double[list.size() * 4];
        for (int i = 0; i < list.size(); ++i)
            System.arraycopy(list.get(i), 0, edges, 4 * i, 4);
        return edges;
    }

    /**
     * Inside/outside per grid point by scanline (nonzero winding), the exact distance near the edges,
     * a distance transform farther away
     */
    private void build(double[] e) {
        int n = e.length / 4;
        boolean[] inside = new boolean[gw * gh];
        double[] xs = new double[n];
        int[] dirs = new int[n];
        Integer[] order = new Integer[n];
        for (int j = 0; j < gh; ++j) {
            double y = y0 + j + 1e-7;
            int m = 0;
            for (int s = 0; s < n; ++s) {
                double ay = e[4 * s + 1], by = e[4 * s + 3];
                if ((ay <= y) == (by <= y)) continue;
                double ax = e[4 * s], bx = e[4 * s + 2];
                xs[m] = ax + (y - ay) / (by - ay) * (bx - ax);
                dirs[m] = by > ay ? 1 : -1;
                order[m] = m;
                ++m;
            }
            final double[] row = xs;
            Arrays.sort(order, 0, m, (a, b) -> Double.compare(row[a], row[b]));
            int winding = 0, k = 0;
            for (int i = 0; i < gw; ++i) {
                double x = x0 + i;
                while (k < m && xs[order[k]] < x) winding += dirs[order[k++]];
                inside[j * gw + i] = winding != 0;
            }
        }

        final double band = 2;
        float[] exact = new float[gw * gh];
        Arrays.fill(exact, Float.MAX_VALUE);
        for (int s = 0; s < n; ++s) {
            double ax = e[4 * s], ay = e[4 * s + 1], bx = e[4 * s + 2], by = e[4 * s + 3];
            int i0 = Math.max(0, (int) Math.floor(Math.min(ax, bx) - band) - x0);
            int i1 = Math.min(gw - 1, (int) Math.ceil(Math.max(ax, bx) + band) - x0);
            int j0 = Math.max(0, (int) Math.floor(Math.min(ay, by) - band) - y0);
            int j1 = Math.min(gh - 1, (int) Math.ceil(Math.max(ay, by) + band) - y0);
            for (int j = j0; j <= j1; ++j)
                for (int i = i0; i <= i1; ++i) {
                    float d = (float) Paint.segment(x0 + i, y0 + j, ax, ay, bx, by);
                    if (d < exact[j * gw + i]) exact[j * gw + i] = d;
                }
        }

        double[] f = new double[gw * gh];
        double far = 2.0 * (gw + gh) * (gw + gh); // "no seed" - not 1e20, which would swallow the q² terms
        for (int p = 0; p < f.length; ++p)
            f[p] = exact[p] <= 0.75 ? 0 : far;
        transform(f);
        for (int p = 0; p < f.length; ++p) {
            double d = exact[p] <= band ? exact[p] : Math.sqrt(f[p]) + 0.5;
            field[p] = (float) (inside[p] ? -d : d);
        }
    }

    /**
     * Squared Euclidean distance transform in place (Felzenszwalb and Huttenlocher), columns then rows
     */
    private void transform(double[] f) {
        int len = Math.max(gw, gh);
        double[] line = new double[len], out = new double[len], z = new double[len + 1];
        int[] v = new int[len];
        for (int i = 0; i < gw; ++i) {
            for (int j = 0; j < gh; ++j) line[j] = f[j * gw + i];
            transform1d(line, gh, out, v, z);
            for (int j = 0; j < gh; ++j) f[j * gw + i] = out[j];
        }
        for (int j = 0; j < gh; ++j) {
            System.arraycopy(f, j * gw, line, 0, gw);
            transform1d(line, gw, out, v, z);
            System.arraycopy(out, 0, f, j * gw, gw);
        }
    }

    private static void transform1d(double[] f, int n, double[] d, int[] v, double[] z) {
        int k = 0;
        v[0] = 0;
        z[0] = Double.NEGATIVE_INFINITY;
        z[1] = Double.POSITIVE_INFINITY;
        for (int q = 1; q < n; ++q) {
            double s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2.0 * q - 2.0 * v[k]);
            while (s <= z[k]) {
                --k;
                s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2.0 * q - 2.0 * v[k]);
            }
            ++k;
            v[k] = q;
            z[k] = s;
            z[k + 1] = Double.POSITIVE_INFINITY;
        }
        k = 0;
        for (int q = 0; q < n; ++q) {
            while (z[k + 1] < q) ++k;
            d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
        }
    }
}
