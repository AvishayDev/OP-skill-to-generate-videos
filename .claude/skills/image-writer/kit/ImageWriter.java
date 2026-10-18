package imagewriter;

import javax.imageio.ImageIO;
import java.awt.AlphaComposite;
import java.awt.Font;
import java.awt.FontFormatException;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.font.FontRenderContext;
import java.awt.font.TextLayout;
import java.awt.geom.Rectangle2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.io.File;
import java.io.IOException;

/**
 * The ImageWriter of the Mini-Pro ray tracer (AvishayDev/Mini-Pro, renderer/ImageWriter.java): a pixel color
 * matrix that is written to a PNG. Here it is fed directly - the color of every pixel is computed by a
 * Painting - and it can draw text, glowing text, rounded labels and pictures on the finished image.
 */
public class ImageWriter {
    private final int nX;
    private final int nY;
    private final BufferedImage image;

    /**
     * @param nX width in pixels
     * @param nY height in pixels
     */
    public ImageWriter(int nX, int nY) {
        this.nX = nX;
        this.nY = nY;
        image = new BufferedImage(nX, nY, BufferedImage.TYPE_INT_RGB);
    }

    public int getNx() {
        return nX;
    }

    public int getNy() {
        return nY;
    }

    public BufferedImage image() {
        return image;
    }

    /**
     * Write the color of one pixel (safe to call from several threads for different pixels)
     */
    public void writePixel(int xIndex, int yIndex, Color color) {
        image.setRGB(xIndex, yIndex, color.rgb());
    }

    /**
     * Save as PNG (or JPEG when the name ends with .jpg)
     */
    public void writeToFile(File file) throws IOException {
        File dir = file.getAbsoluteFile().getParentFile();
        if (dir != null) dir.mkdirs();
        String name = file.getName().toLowerCase();
        ImageIO.write(image, name.endsWith(".jpg") || name.endsWith(".jpeg") ? "jpg" : "png", file);
    }

    // ***************** Overlays (drawn after the pixels) ******************** //

    /**
     * Load a TrueType font file, falling back to a system font if the file is missing or unreadable
     */
    public static Font loadFont(String path, String fallback, float size) {
        try {
            if (path != null) return Font.createFont(Font.TRUETYPE_FONT, new File(path)).deriveFont(size);
        } catch (FontFormatException | IOException ignored) {
        }
        return new Font(fallback, Font.BOLD, Math.round(size));
    }

    /**
     * @return the font in the size that makes the text exactly `width` pixels wide
     */
    public static Font fitFont(String text, Font font, double width) {
        double current = layout(text, font).getBounds().getWidth();
        return font.deriveFont((float) (font.getSize2D() * width / current));
    }

    /**
     * Draw a text centered on a point (right-to-left scripts are supported)
     */
    public void drawText(String text, Font font, Color color, double centerX, double centerY) {
        drawText(text, font, color, centerX, centerY, 1);
    }

    /**
     * Draw a text centered on a point with an opacity (0..1) - for fading text in and out
     */
    public void drawText(String text, Font font, Color color, double centerX, double centerY, double alpha) {
        if (alpha <= 0) return;
        Graphics2D g = graphics(image);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, (float) Math.min(1, alpha)));
        g.setColor(color.awt());
        drawCentered(g, text, font, centerX, centerY);
        g.dispose();
    }

    /**
     * Draw a text centered on a point with a soft glow around it
     */
    public void drawGlowText(String text, Font font, Color color, double centerX, double centerY, Color glow,
                             int glowRadius, double alpha) {
        if (alpha <= 0) return;
        Rectangle2D bounds = layout(text, font).getBounds();
        int pad = glowRadius * 3;
        int w = (int) bounds.getWidth() + 2 * pad;
        int h = (int) bounds.getHeight() + 2 * pad;

        BufferedImage layer = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB_PRE);
        Graphics2D g = graphics(layer);
        g.setColor(glow.awt());
        drawCentered(g, text, font, w / 2d, h / 2d);
        g.dispose();
        layer = blur(blur(layer, glowRadius, true), glowRadius, false);

        g = graphics(image);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, (float) Math.min(1, alpha)));
        int x = (int) (centerX - w / 2d);
        int y = (int) (centerY - h / 2d);
        g.drawImage(layer, x, y, null);
        g.drawImage(layer, x, y, null);
        g.dispose();
        drawText(text, font, color, centerX, centerY, alpha);
    }

    /**
     * Fill a rounded rectangle (x, y = top-left) with an opacity (0..1)
     */
    public void fillRoundRect(double x, double y, double width, double height, double radius, Color color, double alpha) {
        if (alpha <= 0) return;
        Graphics2D g = graphics(image);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, (float) Math.min(1, alpha)));
        g.setColor(color.awt());
        g.fill(new RoundRectangle2D.Double(x, y, width, height, 2 * radius, 2 * radius));
        g.dispose();
    }

    /**
     * Draw a picture file (PNG with transparency, JPG) into a box (x, y = top-left) with an opacity (0..1)
     */
    public void drawImage(File file, double x, double y, double width, double height, double alpha) throws IOException {
        if (alpha <= 0) return;
        BufferedImage picture = ImageIO.read(file);
        Graphics2D g = graphics(image);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, (float) Math.min(1, alpha)));
        g.drawImage(picture, (int) x, (int) y, (int) width, (int) height, null);
        g.dispose();
    }

    private static Graphics2D graphics(BufferedImage img) {
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
        return g;
    }

    private static TextLayout layout(String text, Font font) {
        return new TextLayout(text, font, new FontRenderContext(null, true, true));
    }

    /**
     * Draw a text so that its visible bounds are centered on a point
     */
    private static void drawCentered(Graphics2D g, String text, Font font, double centerX, double centerY) {
        TextLayout layout = layout(text, font);
        Rectangle2D b = layout.getBounds();
        layout.draw(g, (float) (centerX - b.getCenterX()), (float) (centerY - b.getCenterY()));
    }

    /**
     * One pass of a separable gaussian blur
     */
    private static BufferedImage blur(BufferedImage img, int radius, boolean horizontal) {
        int size = radius * 2 + 1;
        float[] weights = new float[size];
        double sigma = radius / 2.5, sum = 0;
        for (int i = 0; i < size; ++i) {
            weights[i] = (float) Math.exp(-(i - radius) * (i - radius) / (2 * sigma * sigma));
            sum += weights[i];
        }
        for (int i = 0; i < size; ++i)
            weights[i] /= sum;
        Kernel kernel = horizontal ? new Kernel(size, 1, weights) : new Kernel(1, size, weights);
        return new ConvolveOp(kernel, ConvolveOp.EDGE_ZERO_FILL, null).filter(img, null);
    }
}
