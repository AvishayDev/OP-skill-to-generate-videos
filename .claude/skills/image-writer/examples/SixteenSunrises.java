import imagewriter.Color;
import imagewriter.ImageWriter;
import imagewriter.Painting;

import java.awt.Font;

import static imagewriter.Paint.*;

/**
 * A sunrise seen from orbit over the night side of the Earth - "16 sunrises a day, on the space station".
 * Every pixel is a formula of (x, y, t): the Earth's limb is a circle, the atmosphere is layers that fade with
 * the height above it, the sun rises over the limb, rays and bloom grow with it, stars twinkle, city lights are
 * noise in perspective. The text comes in with the ImageWriter overlays.
 * Still: paint.sh SixteenSunrises.java out.png --at 5 --set font=<Heebo.ttf>
 * Film:  paint.sh SixteenSunrises.java out.mp4 --seconds 6 --fps 30 --set font=<Heebo.ttf>
 */
public class SixteenSunrises extends Painting {
    private static final Color SUN_CORE = new Color(255, 250, 238);
    private static final Color SUN_BLOOM = new Color(255, 196, 130);
    private static final Color SUN_HALO = new Color(255, 150, 70);
    private static final Color LIMB_LINE = new Color(255, 225, 160);
    private static final Color ORANGE_LAYER = new Color(255, 110, 35);
    private static final Color BLUE_LAYER = new Color(35, 115, 235);
    private static final Color NIGHT_FAR = new Color(12, 26, 58);
    private static final Color NIGHT_NEAR = new Color(3, 6, 15);
    private static final Color CITY = new Color(255, 185, 105);
    private static final Color MOON = new Color(235, 228, 215);

    private double earthR, earthX, earthY, sunAngle, moonX, moonY, moonR;
    private Font font;

    @Override
    protected void setup() {
        // all sizes are fractions of the frame, so any aspect ratio works
        earthR = 2.4 * width;
        earthX = width / 2d;
        earthY = 0.6 * height + earthR;
        sunAngle = Math.asin(0.2 * width / earthR);
        moonX = 0.27 * width;
        moonY = 0.15 * height;
        moonR = 0.057 * width;
        font = ImageWriter.loadFont(option("font", null), "DejaVu Sans", 100);
    }

    /**
     * the sun's height above the limb in pixels: it rises over the first 3.5 seconds (a still shows it risen)
     */
    private double sunHeight(double t) {
        return seconds == 0 ? 6 : mix(-26, 6, easeOut(progress(t, 0, 3.5)));
    }

    @Override
    public Color pixel(double x, double y, double t) {
        double dx = x - earthX, dy = y - earthY;
        double h = Math.sqrt(dx * dx + dy * dy) - earthR; // above the limb > 0
        double alongLimb = (Math.atan2(dx, -dy) - sunAngle) * earthR; // pixels along the limb from the sun
        double rise = smoothstep(-26, 6, sunHeight(t)); // 0 before sunrise, 1 when risen
        double nearSun = Math.exp(-sq(alongLimb / 380)) * (0.35 + 0.65 * rise);
        double wide = Math.exp(-sq(alongLimb / 650));

        double sky = coverage(-h); // anti-aliased limb
        Color color = sky == 0 ? ground(x, -h, nearSun, wide)
                : sky == 1 ? space(x, y, h, nearSun, wide, t)
                : ground(x, -h, nearSun, wide).lerp(space(x, y, h, nearSun, wide, t), sky);

        color = color.add(sun(x, y, t, sky, rise));

        double vx = (x / width - 0.5) * 2, vy = (y / height - 0.5) * 2;
        double vignette = 1 - 0.3 * (0.6 * vx * vx + 0.4 * vy * vy);
        double g = grain(x, y, frame) * 5 + 2.5;
        return color.scale(vignette).add(new Color(g, g, g));
    }

    private Color space(double x, double y, double h, double nearSun, double wide, double t) {
        Color color = LIMB_LINE.scale(Math.exp(-h / 2.5) * (0.25 + 1.2 * nearSun))
                .add(ORANGE_LAYER.scale(Math.exp(-h / 16) * (0.1 + 1.6 * nearSun)))
                .add(BLUE_LAYER.scale(Math.exp(-h / 45) * (0.3 + 0.7 * wide)))
                .add(BLUE_LAYER.scale(0.12 * Math.exp(-h / 260) * wide));
        double clear = smoothstep(260, 400, h); // no stars inside the glow
        return color.add(stars(x, y, t).scale(clear)).add(moon(x, y));
    }

    /**
     * the night side with city lights; depth = pixels below the limb
     */
    private Color ground(double x, double depth, double nearSun, double wide) {
        double distance = 4000 / (depth + 4); // perspective: far near the limb
        double u = (x - width / 2d) * distance / 500, v = distance;
        Color color = NIGHT_FAR.lerp(NIGHT_NEAR, smoothstep(0, 400, depth))
                .add(BLUE_LAYER.scale(0.6 * Math.exp(-depth / 7) * (0.4 + wide)))
                .add(ORANGE_LAYER.scale(0.9 * Math.exp(-depth / 22) * nearSun));
        double region = smoothstep(0.55, 0.66, fbm(u / 18, v / 18, 3.7, 4));
        double sparkle = smoothstep(0.58, 0.8, fbm(x / 2.2, depth / 2.2, 9.1, 2)); // pinpoints, near or far
        return color.add(CITY.scale(region * (0.08 + 1.8 * sparkle) * smoothstep(8, 90, depth)));
    }

    private Color sun(double x, double y, double t, double sky, double rise) {
        double sh = sunHeight(t);
        double sunX = earthX + (earthR + sh) * Math.sin(sunAngle), sunY = earthY - (earthR + sh) * Math.cos(sunAngle);
        double dx = x - sunX, dy = y - sunY, r = Math.sqrt(dx * dx + dy * dy);
        double angle = Math.atan2(dy, dx) + 0.04 * t; // the rays turn slowly
        double rays = Math.pow(Math.abs(Math.cos(3 * angle)), 300) + 0.5 * Math.pow(Math.abs(Math.cos(4 * angle + 0.4)), 500);
        double core = coverage(r - 12) * sky; // the disc hides behind the Earth
        return SUN_CORE.scale(core * rise)
                .add(SUN_BLOOM.scale(1.3 * Math.exp(-r / 22) * rise))
                .add(SUN_HALO.scale(0.45 * Math.exp(-r / 150) * (0.3 + 0.7 * rise)))
                .add(SUN_CORE.scale(0.7 * rays * Math.exp(-r / (40 + 70 * rise)) * rise));
    }

    private Color moon(double x, double y) {
        double dx = (x - moonX) / moonR, dy = (y - moonY) / moonR, r2 = dx * dx + dy * dy;
        double cover = coverage(circle(x, y, moonX, moonY, moonR));
        if (cover == 0) return Color.BLACK;
        double nz = Math.sqrt(Math.max(0, 1 - r2));
        double lit = smoothstep(-0.02, 0.12, dx * 0.62 + dy * 0.42 - nz * 0.66); // sun behind, lower right
        double texture = 0.85 + 0.3 * fbm(dx * 4 + 5, dy * 4, nz * 4, 4);
        return MOON.scale(lit * texture * cover).add(new Color(6, 8, 14).scale(cover));
    }

    /**
     * one star at a random spot in some cells of a 22 px grid, a soft dot that twinkles
     */
    private Color stars(double x, double y, double t) {
        int cx = (int) Math.floor(x / 22), cy = (int) Math.floor(y / 22);
        if (hash(cx, cy, 1) > 0.4) return Color.BLACK;
        double sx = (cx + 0.15 + 0.7 * hash(cx, cy, 2)) * 22, sy = (cy + 0.15 + 0.7 * hash(cx, cy, 3)) * 22;
        double twinkle = 0.75 + 0.25 * Math.sin(t * (2 + 4 * hash(cx, cy, 6)) + 6.28 * hash(cx, cy, 7));
        double brightness = Math.pow(hash(cx, cy, 4), 4) * 255 * twinkle;
        double warm = hash(cx, cy, 5);
        return new Color(0.9 + 0.1 * warm, 0.92, 1.05 - 0.1 * warm)
                .scale(brightness * Math.exp(-(sq(x - sx) + sq(y - sy)) / 0.9));
    }

    @Override
    public void overlay(ImageWriter w, double t) {
        boolean still = seconds == 0;
        double title = still ? 1 : progress(t, 1.6, 0.6), sub = still ? 1 : progress(t, 2.3, 0.5);
        double label = still ? 1 : progress(t, 3.0, 0.5);
        double rise = (1 - easeOut(title)) * 0.02 * height;

        w.drawGlowText("16 זריחות", ImageWriter.fitFont("16 זריחות", font, 0.66 * width),
                new Color(255, 248, 238), width / 2d, 0.33 * height + rise, new Color(255, 120, 40), 24, title);
        w.drawText("בכל יום", ImageWriter.fitFont("בכל יום", font, 0.3 * width),
                new Color(255, 170, 90), width / 2d, 0.415 * height, sub);

        Font small = ImageWriter.fitFont("החלל.", font, 0.12 * width);
        w.fillRoundRect(0.31 * width, 0.791 * height, 0.38 * width, 0.052 * height, 0.016 * width, new Color(40, 44, 58), 0.88 * label);
        w.fillRoundRect(0.337 * width, 0.799 * height, 0.158 * width, 0.036 * height, 0.013 * width, new Color(255, 150, 70), label);
        w.drawText("החלל.", small, new Color(40, 22, 10), 0.416 * width, 0.817 * height, label);
        w.drawText("בתחנת", small, new Color(240, 232, 225), 0.585 * width, 0.817 * height, label);
    }
}
