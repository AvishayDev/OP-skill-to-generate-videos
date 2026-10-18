package imagewriter;

import java.util.Map;

/**
 * An image or a film described pixel by pixel: extend it, decide the color of every pixel in pixel(x, y, t),
 * and optionally draw text and labels on the finished frame in overlay(). Studio renders it.
 */
public abstract class Painting {
    /**
     * frame size in pixels
     */
    protected int width, height;
    /**
     * film length in seconds and frames per second (a still has seconds = 0)
     */
    protected double seconds, fps;
    /**
     * the current frame number - for grain or anything that should change every frame
     */
    protected int frame;
    /**
     * extra --set key=value options from the command line (font paths, colors, words)
     */
    protected Map<String, String> options;

    /**
     * Called once before rendering, after width/height/seconds/fps/options are set
     */
    protected void setup() {
    }

    /**
     * The color of one pixel
     *
     * @param x pixel X (the pixel center is x + 0.5; with --aa the sample positions fall inside the pixel)
     * @param y pixel Y, 0 at the top
     * @param t time in seconds
     * @return the color
     */
    public abstract Color pixel(double x, double y, double t);

    /**
     * Draw on the finished frame (text, labels) with the ImageWriter overlays
     *
     * @param writer the frame
     * @param t      time in seconds
     */
    public void overlay(ImageWriter writer, double t) {
    }

    protected String option(String key, String fallback) {
        return options.getOrDefault(key, fallback);
    }
}
