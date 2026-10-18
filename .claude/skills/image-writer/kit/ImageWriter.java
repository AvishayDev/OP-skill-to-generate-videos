package imagewriter;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

/**
 * The ImageWriter of the Mini-Pro ray tracer (AvishayDev/Mini-Pro, renderer/ImageWriter.java): a pixel color
 * matrix that is written to a PNG. That is all it does here too - there is no camera, scene, geometry or ray:
 * every pixel's color is computed by a Painting and written with writePixel, one pixel at a time.
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

    /**
     * Write the color of one pixel (safe to call from several threads for different pixels)
     */
    public void writePixel(int xIndex, int yIndex, Color color) {
        image.setRGB(xIndex, yIndex, color.rgb());
    }

    /**
     * Read back the color already written to one pixel
     */
    public Color readPixel(int xIndex, int yIndex) {
        int v = image.getRGB(xIndex, yIndex);
        return new Color((v >> 16) & 255, (v >> 8) & 255, v & 255);
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
}
