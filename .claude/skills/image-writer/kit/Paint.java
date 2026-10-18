package imagewriter;

/**
 * Math for deciding a pixel's color: shaping curves, noise, and shape coverage with soft (anti-aliased) edges.
 * Use it with `import static imagewriter.Paint.*;`.
 */
public final class Paint {
    private Paint() {
    }

    public static double clamp(double v, double lo, double hi) {
        return v < lo ? lo : v > hi ? hi : v;
    }

    public static double clamp01(double v) {
        return clamp(v, 0, 1);
    }

    public static double mix(double a, double b, double t) {
        return a + (b - a) * t;
    }

    public static double sq(double a) {
        return a * a;
    }

    /**
     * 0 below edge0, 1 above edge1, smooth in between (edge0 > edge1 gives the reverse ramp)
     */
    public static double smoothstep(double edge0, double edge1, double x) {
        double t = clamp01((x - edge0) / (edge1 - edge0));
        return t * t * (3 - 2 * t);
    }

    /**
     * Progress of t through [start, start + length], 0..1
     */
    public static double progress(double t, double start, double length) {
        return clamp01((t - start) / length);
    }

    public static double easeOut(double t) {
        return 1 - Math.pow(1 - clamp01(t), 3);
    }

    public static double easeInOut(double t) {
        t = clamp01(t);
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * How much of the pixel a shape covers, from the signed distance to its edge in pixels
     * (negative inside). Gives a one-pixel soft edge instead of jaggies.
     */
    public static double coverage(double signedDistance) {
        return clamp01(0.5 - signedDistance);
    }

    /**
     * Signed distance from (x, y) to a circle's edge, negative inside
     */
    public static double circle(double x, double y, double cx, double cy, double radius) {
        return Math.hypot(x - cx, y - cy) - radius;
    }

    /**
     * Signed distance from (x, y) to a rounded box's edge, negative inside
     */
    public static double roundBox(double x, double y, double cx, double cy, double halfW, double halfH, double radius) {
        double qx = Math.abs(x - cx) - halfW + radius, qy = Math.abs(y - cy) - halfH + radius;
        return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
    }

    /**
     * Distance from (x, y) to the line segment a-b (subtract a half-thickness for a stroke: lines, arrows, rays)
     */
    public static double segment(double x, double y, double ax, double ay, double bx, double by) {
        double px = x - ax, py = y - ay, ux = bx - ax, uy = by - ay;
        double k = clamp01((px * ux + py * uy) / Math.max(1e-12, ux * ux + uy * uy));
        return Math.hypot(px - k * ux, py - k * uy);
    }

    /**
     * A repeatable random number in 0..1 for an integer lattice point
     */
    public static double hash(int x, int y, int z) {
        int h = x * 374761393 + y * 668265263 + z * 1274126177;
        h = (h ^ (h >>> 13)) * 1274126177;
        h ^= h >>> 16;
        return (h & 0x7fffffff) / (double) 0x7fffffff;
    }

    /**
     * Smooth value noise in 0..1
     */
    public static double noise(double x, double y, double z) {
        int ix = (int) Math.floor(x), iy = (int) Math.floor(y), iz = (int) Math.floor(z);
        double fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
        double x00 = mix(hash(ix, iy, iz), hash(ix + 1, iy, iz), fx);
        double x10 = mix(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), fx);
        double x01 = mix(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), fx);
        double x11 = mix(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), fx);
        return mix(mix(x00, x10, fy), mix(x01, x11, fy), fz);
    }

    /**
     * Fractal noise in 0..1: clouds, terrain, paper, smoke. Animate it by moving z with time.
     */
    public static double fbm(double x, double y, double z, int octaves) {
        double sum = 0, amplitude = 0.5, total = 0;
        for (int i = 0; i < octaves; ++i) {
            sum += amplitude * noise(x, y, z);
            total += amplitude;
            amplitude *= 0.5;
            x *= 2.03;
            y *= 2.03;
            z *= 2.03;
        }
        return sum / total;
    }

    /**
     * Film grain: a small random offset for a pixel, different every frame
     */
    public static double grain(double x, double y, int frame) {
        return hash((int) x, (int) y, frame * 7919 + 7) - 0.5;
    }

    private static double fade(double t) {
        return t * t * (3 - 2 * t);
    }
}
