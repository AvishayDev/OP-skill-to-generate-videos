package imagewriter;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;

/**
 * A picture file (a logo, a photo) read into memory as pixel colors, to be sampled inside pixel() - it is
 * never drawn, you decide per pixel where and how much of it shows. Load it once in setup().
 */
public final class Picture {
    public final int width, height;
    private final int[] argb;

    public Picture(String path) {
        try {
            BufferedImage img = ImageIO.read(new File(path));
            if (img == null) throw new IOException("not an image: " + path);
            width = img.getWidth();
            height = img.getHeight();
            argb = img.getRGB(0, 0, width, height, null, 0, width);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /**
     * The picture laid over a base color at picture coordinates (u, v), 0..1 across and down, with an
     * opacity (0..1); outside the picture the base comes back unchanged. Bilinear between its pixels.
     */
    public Color over(Color base, double u, double v, double opacity) {
        if (u < 0 || v < 0 || u > 1 || v > 1 || opacity <= 0) return base;
        double x = Paint.clamp(u * width - 0.5, 0, width - 1), y = Paint.clamp(v * height - 0.5, 0, height - 1);
        int i = (int) x, j = (int) y, i1 = Math.min(i + 1, width - 1), j1 = Math.min(j + 1, height - 1);
        double fx = x - i, fy = y - j;
        double r = 0, g = 0, b = 0, a = 0;
        int[] px = {j * width + i, j * width + i1, j1 * width + i, j1 * width + i1};
        double[] w = {(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy};
        for (int k = 0; k < 4; ++k) {
            int c = argb[px[k]];
            double ak = ((c >>> 24) & 255) / 255.0 * w[k]; // premultiplied, so transparent edges don't darken
            r += ((c >> 16) & 255) * ak;
            g += ((c >> 8) & 255) * ak;
            b += (c & 255) * ak;
            a += ak;
        }
        a *= opacity;
        return base.scale(1 - a).add(new Color(r, g, b).scale(opacity));
    }
}
