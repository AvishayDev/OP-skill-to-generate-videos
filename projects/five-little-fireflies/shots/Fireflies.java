import imagewriter.*;

import java.awt.Font;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import static imagewriter.Paint.*;

/**
 * Five Little Fireflies - one continuous moonlit meadow, painted pixel by pixel. Every shot renders a window of the
 * same world: --set shot=<id> picks the camera, --set t0=<s> is the shot's start in the song, and the story beats
 * (sunset, the moon waking, fireflies popping up, hopping "up, up, up" to the moon, turning into stars) land on the
 * spoken words read from --set timeline=shots/timeline.txt.
 * World units are 1920x1080 pixels of the wide shot; the camera zooms and pans over it.
 */
public class Fireflies extends Painting {
    // ---- palette ----
    static final Color SKY_TOP_DUSK = Color.hex("#3B4BA8"), SKY_LOW_DUSK = Color.hex("#FF9E6B");
    static final Color SKY_TOP_NIGHT = Color.hex("#070E33"), SKY_LOW_NIGHT = Color.hex("#2A3C8E");
    static final Color SUN = Color.hex("#FFD27A"), MOON = Color.hex("#FFF3C4"), MOON_GLOW = Color.hex("#FFE9A0");
    static final Color FACE = Color.hex("#3A2A55"), BLUSH = Color.hex("#FF8FB1"), WHITE = Color.hex("#FFFFFF");
    static final Color HILL_FAR_DUSK = Color.hex("#6B4C7A"), HILL_FAR_NIGHT = Color.hex("#1D3462");
    static final Color HILL_NEAR_DUSK = Color.hex("#3D5A3A"), HILL_NEAR_NIGHT = Color.hex("#163F3A");
    static final Color GRASS_DUSK = Color.hex("#2F5A2C"), GRASS_NIGHT = Color.hex("#0F3A2A");
    static final Color[] BUG = {Color.hex("#FFD93D"), Color.hex("#5BF5B0"), Color.hex("#FF7AC8"), Color.hex("#6FD3FF"), Color.hex("#B48CFF")};
    static final String[] VERSE = {"five", "four", "three", "two", "one"};
    static final String[] DIGIT = {"5", "4", "3", "2", "1"};

    // ---- world layout ----
    static final double MX = 1480, MY = 250, MR = 118;                 // the moon
    static final double[][] STAR = {{1190, 150}, {1235, 420}, {1480, 500}, {1725, 420}, {1770, 150}};

    // ---- story times (seconds into the song) ----
    double t0, sunDown, blue, starsOn, wake, glowing, fiveAppear, countEnd, dance, danceEnd, endNo, endFive, endNight;
    double[] introBlinks, endBlinks, countAt = new double[5];
    double[] flew = new double[5], moon = new double[5], bright = new double[5], night = new double[5];
    double[][] ups = new double[5][3], blinks = new double[5][3];
    String shot;
    Font digits, small;
    final List<String[]> words = new ArrayList<>();

    @Override
    protected void setup() {
        t0 = Double.parseDouble(option("t0", "0"));
        shot = option("shot", "intro-a");
        digits = ImageWriter.loadFont(option("font", null), "DejaVu Sans", 200);
        try {
            for (String line : Files.readAllLines(Paths.get(option("timeline", "shots/timeline.txt"))))
                if (!line.isBlank()) words.add(line.trim().split(" "));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        sunDown = at("intro", "down", 1);
        blue = at("intro", "blue", 1);
        starsOn = at("intro", "stars", 1);
        wake = at("intro", "wake", 1);
        glowing = at("intro", "glowing", 1);
        fiveAppear = at("intro", "five", 1);
        introBlinks = new double[]{at("intro", "blink", 1), at("intro", "blink", 2), at("intro", "blink", 3)};
        String[] nums = {"one", "two", "three", "four", "five"};
        for (int i = 0; i < 5; ++i) countAt[i] = at("count", nums[i], 1);
        dance = at("count", "dance", 1);
        countEnd = at("count", "lights", 1);
        danceEnd = at("five", "five", 1);
        for (int k = 0; k < 5; ++k) {
            String v = VERSE[k];
            flew[k] = at(v, "flew", 1);
            for (int i = 0; i < 3; ++i) ups[k][i] = at(v, "up", i + 1);
            for (int i = 0; i < 3; ++i) blinks[k][i] = at(v, "blink", i + 1);
            moon[k] = at(v, "moon", 1);
            bright[k] = at(v, "bright", 1);
            night[k] = at(v, "goodnight", 1);
        }
        endNo = at("end", "no", 1);
        endFive = at("end", "five", 1);
        endBlinks = new double[]{at("end", "blink", 1), at("end", "blink", 2), at("end", "blink", 3)};
        endNight = at("end", "goodnight", 1);
    }

    /** start time of the n-th (1-based) occurrence of a word in a segment */
    double at(String seg, String word, int n) {
        for (String[] w : words)
            if (w[0].equals(seg) && w[1].equals(word) && --n == 0) return Double.parseDouble(w[2]);
        throw new IllegalArgumentException("no word " + word + " in " + seg);
    }

    // ================= camera =================

    /** {cx, cy, zoom} for the song time G */
    double[] camera(double G) {
        double u = clamp01((G - t0) / Math.max(seconds, 1e-6));
        int k = verseOf(shot);
        double[] a, b;
        switch (shot) {
            case "intro-a" -> { a = v(960, 540, 1.0); b = v(960, 565, 1.08); }
            case "intro-b" -> { a = v(1380, 330, 1.75); b = v(1340, 340, 1.55); }
            case "intro-c" -> { a = v(960, 770, 2.3); b = v(975, 760, 2.55); }
            case "intro-d" -> { a = v(960, 640, 1.4); b = v(960, 615, 1.3); }
            case "count-a" -> { a = v(960, 610, 1.3); b = v(960, 600, 1.38); }
            case "count-b" -> { a = v(700, 590, 1.85); b = v(820, 590, 1.85); }
            case "count-c" -> { a = v(1230, 590, 1.9); b = v(1270, 585, 1.95); }
            case "count-d" -> { a = v(960, 560, 1.05); b = v(960, 575, 1.15); }
            case "end-a" -> { a = v(960, 720, 1.55); b = v(960, 705, 1.65); }
            case "end-b" -> { a = v(960, 730, 1.55); b = v(1440, 300, 1.4); u = easeInOut(progress(G, endNo + 4.4, 2.4)); }
            case "end-c" -> { a = v(1480, 320, 1.45); b = v(1480, 305, 1.55); }
            case "end-d" -> { a = v(1480, 305, 1.55); b = v(1300, 420, 1.12); }
            default -> {
                double gx = groupCenter(k);
                if (shot.endsWith("-a")) { a = v(gx, 600, 1.3); b = v(gx, 590, 1.4); }
                else if (shot.endsWith("-c")) {
                    double cx = (MX + STAR[k][0]) / 2, cy = (MY + STAR[k][1]) / 2 + 30;
                    a = v(cx, cy, 1.9); b = v(cx, cy - 10, 2.05);
                } else { // -b: follow the flyer, smoothed over the last half second
                    double sx = 0, sy = 0;
                    for (int i = 0; i < 6; ++i) {
                        double[] p = position(k, G - 0.1 * i);
                        sx += p[0];
                        sy += p[1];
                    }
                    double z = mix(1.55, 1.35, easeInOut(progress(G, flew[k], moon[k] - flew[k])));
                    return new double[]{sx / 6, sy / 6 - 40, z};
                }
            }
        }
        double e = shot.equals("end-b") ? u : easeInOut(u);
        return new double[]{mix(a[0], b[0], e), mix(a[1], b[1], e), mix(a[2], b[2], e)};
    }

    static double[] v(double x, double y, double z) {
        return new double[]{x, y, z};
    }

    static int verseOf(String id) {
        for (int k = 0; k < 5; ++k) if (id.startsWith(VERSE[k] + "-")) return k;
        return -1;
    }

    double groupCenter(int k) {
        double s = 0;
        for (int i = k; i < 5; ++i) s += homeX(i);
        return s / (5 - k);
    }

    // ================= the fireflies =================

    static double homeX(int k) {
        return 560 + 200 * k;
    }

    static double homeY(int k) {
        return 615 + 28 * Math.sin(k * 1.7);
    }

    /** where firefly k is at song time G (before it appears it hides in the grass) */
    double[] position(int k, double G) {
        double hx = homeX(k) + 22 * Math.sin(G * 0.9 + k * 2.1), hy = homeY(k) + 16 * Math.sin(G * 1.7 + k * 1.3);
        double appear = fiveAppear + 0.28 * k;
        double rise = easeOutBack(progress(G, appear, 0.7));
        hy = mix(845, hy, rise);
        // the dance: a circle around the meadow, then back home
        double d = smoothstep(dance - 0.2, dance + 0.6, G) * (1 - smoothstep(danceEnd - 0.9, danceEnd - 0.1, G));
        if (d > 0) {
            double ang = k * 2 * Math.PI / 5 + (G - dance) * 1.7 - Math.PI / 2;
            hx = mix(hx, 960 + 300 * Math.cos(ang), d);
            hy = mix(hy, 585 + 120 * Math.sin(ang), d);
        }
        if (G < flew[k] - 0.15) return new double[]{hx, hy};
        // up, up, up - three hops - then a glide to the moon, then hovering where its star will be
        double f = flew[k] - 0.15;
        double bx = homeX(k) + 22 * Math.sin(f * 0.9 + k * 2.1), by = homeY(k) + 16 * Math.sin(f * 1.7 + k * 1.3);
        double[][] pts = {{bx, by}, {bx + 25, by - 120}, {bx + 50, by - 240}, {bx + 75, by - 360}, {STAR[k][0], STAR[k][1] + 4}};
        double[] ts = {f, ups[k][0] + 0.25, ups[k][1] + 0.25, ups[k][2] + 0.25, moon[k] + 0.35};
        if (G >= ts[4]) return new double[]{STAR[k][0] + 6 * Math.sin(G * 2 + k), STAR[k][1] + 4 + 6 * Math.sin(G * 2.6 + k)};
        for (int i = 0; i < 4; ++i)
            if (G < ts[i + 1]) {
                double p = clamp01((G - ts[i]) / (ts[i + 1] - ts[i]));
                double e = i < 3 ? easeOut(p) : easeInOut(p);
                double hop = i < 3 ? -35 * Math.sin(Math.PI * p) : -60 * Math.sin(Math.PI * p);
                return new double[]{mix(pts[i][0], pts[i + 1][0], e), mix(pts[i][1], pts[i + 1][1], e) + hop};
            }
        return pts[4];
    }

    static double easeOutBack(double t) {
        t = clamp01(t);
        double c = 1.9;
        return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    }

    static double pulse(double G, double at, double width) {
        return Math.exp(-sq((G - at) / width));
    }

    /** how hard firefly k's tail shines (1 = calm, more on every "blink") */
    double tailLight(int k, double G) {
        double b = 0;
        for (double t : introBlinks) b += pulse(G, t + 0.1, 0.22);
        for (int v = 0; v < 5; ++v) if (v <= k) for (double t : blinks[v]) b += pulse(G, t + 0.1, 0.22);
        return 1 + 0.25 * Math.sin(G * 3 + k * 1.9) + 1.2 * b;
    }

    /** eyes shut on a blink */
    double eyesClosed(int k, double G) {
        double b = 0;
        for (double t : introBlinks) b = Math.max(b, pulse(G, t + 0.1, 0.14));
        for (int v = 0; v <= Math.min(k, 4); ++v) for (double t : blinks[v]) b = Math.max(b, pulse(G, t + 0.1, 0.14));
        return b > 0.55 ? 1 : 0;
    }

    /** 1 while firefly k is a bug, shrinking to 0 as it turns into a star */
    double bugScale(int k, double G) {
        double appear = fiveAppear + 0.28 * k;
        double grow = easeOutBack(progress(G, appear, 0.6));
        return grow * (1 - easeInOut(progress(G, night[k] + 0.1, 0.5)));
    }

    double starScale(int k, double G) {
        return easeOutBack(progress(G, night[k] + 0.35, 0.7));
    }

    // ================= pixel =================

    /** everything that is the same for all pixels of one frame */
    record Frame(double t, double[] cam, double[][] pos, double[] bug, double[] star, double[] light, double[] closed) {
    }

    private volatile Frame frameCache;

    Frame frameAt(double t) {
        Frame f = frameCache;
        if (f != null && f.t == t) return f;
        double G = t0 + t;
        double[][] pos = new double[5][];
        double[] bug = new double[5], star = new double[5], light = new double[5], closed = new double[5];
        for (int k = 0; k < 5; ++k) {
            pos[k] = position(k, G);
            bug[k] = bugScale(k, G);
            star[k] = starScale(k, G);
            light[k] = tailLight(k, G);
            closed[k] = eyesClosed(k, G);
        }
        f = new Frame(t, camera(G), pos, bug, star, light, closed);
        frameCache = f;
        return f;
    }

    @Override
    public Color pixel(double sx, double sy, double t) {
        double G = t0 + t;
        Frame fr = frameAt(t);
        double[] cam = fr.cam;
        double z = cam[2];
        double x = cam[0] + (sx - width / 2d) / z * (1920d / width);
        double y = cam[1] + (sy - height / 2d) / z * (1920d / width);
        double px = 1 / z;                                                 // one screen pixel in world units

        double nightAmt = smoothstep(sunDown - 1.2, blue + 0.6, G);
        // ---- sky ----
        double vy = clamp01((y + 200) / 980);
        Color top = SKY_TOP_DUSK.lerp(SKY_TOP_NIGHT, nightAmt), low = SKY_LOW_DUSK.lerp(SKY_LOW_NIGHT, nightAmt);
        Color c = top.lerp(low, Math.pow(vy, 1.4));
        // soft clouds of light
        if (y < 820) {
        double neb = fbm(x * 0.0022, y * 0.004, 3.1 + G * 0.02, 4);
        c = c.add(Color.hex("#3A2E8A").scale(nightAmt * 0.45 * smoothstep(0.5, 0.8, neb)));
        }
        // stars
        double starsAmt = smoothstep(starsOn - 0.3, starsOn + 1.6, G);
        if (starsAmt > 0 && y < 790) c = c.add(stars(x, y, G, px).scale(starsAmt));
        // the sun setting
        double sunY = 600 + 300 * easeInOut(progress(G, 0, blue + 0.4));
        double ds = Math.hypot(x - 760, y - sunY);
        double sunA = 1 - nightAmt;
        if (sunA > 0) {
            c = c.add(SUN.scale(sunA * 0.65 * Math.exp(-Math.max(ds - 85, 0) / 120)));
            c = c.lerp(SUN.add(WHITE.scale(0.2)), sunA * coverage((ds - 85) / px));
        }
        // ---- the moon ----
        c = moon(c, x, y, G, px);
        // ---- the new stars (fireflies that went to the moon) ----
        for (int k = 0; k < 5; ++k) c = newStar(c, k, x, y, G, px, fr.star[k]);
        // ---- hills and grass ----
        double far = 700 + 38 * Math.sin(x * 0.0041 + 1.0) + 22 * Math.sin(x * 0.0093 + 0.3);
        double near = 790 + 30 * Math.sin(x * 0.0058 + 2.2) + 14 * Math.sin(x * 0.013 + 1.1);
        double rim = Math.exp(-Math.abs(y - far) / 6) * nightAmt;
        if (y > far - 2) {
            Color farC = HILL_FAR_DUSK.lerp(HILL_FAR_NIGHT, nightAmt).lerp(Color.hex("#24427A"), 0.4 * fbm(x * 0.01, y * 0.01, 1, 3));
            c = c.lerp(farC, coverage((far - y) / px));
        }
        c = c.add(MOON_GLOW.scale(0.18 * rim * coverage((far - y) / px - 0.5)));
        // a round tree on the left
        double tree = x > 500 || y < 450 ? 1e9 : Math.min(Math.min(circle(x, y, 240, 600, 120), circle(x, y, 160, 660, 90)), circle(x, y, 330, 650, 95));
        double trunk = roundBox(x, y, 245, 760, 22, 90, 8);
        if (tree < 2 || trunk < 2) {
            Color treeC = Color.hex("#123A33").lerp(Color.hex("#1C5A45"), fbm(x * 0.03, y * 0.03, 4, 3) * 0.8);
            c = c.lerp(Color.hex("#2B1F2E"), coverage(trunk / px));
            c = c.lerp(treeC, coverage(tree / px));
        }
        Color nearC = HILL_NEAR_DUSK.lerp(HILL_NEAR_NIGHT, nightAmt);
        double inGround = coverage((near - y) / px);
        if (inGround > 0) {
            double g = fbm(x * 0.006, y * 0.02, 7, 4);
            Color ground = nearC.lerp(GRASS_DUSK.lerp(GRASS_NIGHT, nightAmt), smoothstep(near, near + 220, y)).scale(0.85 + 0.3 * g);
            c = c.lerp(ground, inGround);
        }
        c = grassBlades(c, x, y, G, px, near, nightAmt, 0.0, 1.0);
        // ---- fireflies (glow first, then bodies) ----
        for (int k = 0; k < 5; ++k) c = firefly(c, k, x, y, G, px, fr);
        // foreground blades in front of everything
        c = grassBlades(c, x, y, G, px, 1050, nightAmt, 3.7, 1.6);
        // ---- finish: vignette, gentle fade at the very end ----
        double vx = sx / width - 0.5, vyy = sy / height - 0.5;
        c = c.scale(1 - 0.35 * smoothstep(0.25, 0.75, vx * vx + vyy * vyy * 1.4));
        c = c.scale(1 - 0.35 * smoothstep(endNight + 1.5, endNight + 3.4, G));
        return c;
    }

    Color stars(double x, double y, double G, double px) {
        Color sum = Color.BLACK;
        double cell = 46;
        int ix = (int) Math.floor(x / cell), iy = (int) Math.floor(y / cell);
        for (int dx = -1; dx <= 1; ++dx)
            for (int dy = -1; dy <= 1; ++dy) {
                int cx = ix + dx, cy = iy + dy;
                double h = hash(cx, cy, 11);
                if (h < 0.72) continue;
                double sxp = (cx + 0.2 + 0.6 * hash(cx, cy, 12)) * cell, syp = (cy + 0.2 + 0.6 * hash(cx, cy, 13)) * cell;
                double size = 1.2 + 2.6 * hash(cx, cy, 14);
                double tw = 0.55 + 0.45 * Math.sin(G * (1.5 + 2 * hash(cx, cy, 15)) + 6.28 * hash(cx, cy, 16));
                double appearAt = starsOn + 1.4 * hash(cx, cy, 17);
                double on = smoothstep(appearAt, appearAt + 0.4, G);
                double d = Math.hypot(x - sxp, y - syp);
                double core = Math.exp(-sq(d / (size * Math.max(px, 0.6))));
                double cross = Math.exp(-Math.abs(x - sxp) / (0.8 * size)) * Math.exp(-Math.abs(y - syp) / (5 * size))
                        + Math.exp(-Math.abs(y - syp) / (0.8 * size)) * Math.exp(-Math.abs(x - sxp) / (5 * size));
                sum = sum.add(Color.hex("#FFF6D8").scale(on * tw * (core * 1.1 + cross * 0.35 * (size > 2.8 ? 1 : 0))));
            }
        return sum.scale(clamp01((780 - y) / 200));
    }

    Color moon(Color c, double x, double y, double G, double px) {
        double appear = smoothstep(sunDown + 0.6, blue + 0.9, G);
        if (appear <= 0) return c;
        double brightP = 0;
        for (double b : bright) brightP += pulse(G, b + 0.2, 0.45);
        double d = circle(x, y, MX, MY, MR);
        c = c.add(MOON_GLOW.scale(appear * (0.42 + 0.35 * brightP) * Math.exp(-Math.max(d, 0) / (90 + 40 * brightP))));
        double inside = coverage(d / px) * appear;
        if (inside <= 0) return c;
        double crater = fbm(x * 0.03, y * 0.03, 2, 4);
        Color m = MOON.scale(0.92 + 0.14 * crater).lerp(Color.hex("#F2DFA0"), smoothstep(0.55, 0.75, crater) * 0.6);
        m = m.add(WHITE.scale(0.15 * brightP));
        // face: blush, eyes (open after "wake", closed again at the final "goodnight"), smile
        double open = progress(G, wake, 0.35) * (1 - progress(G, endNight, 0.9));
        double bob = 3 * Math.sin(G * 1.3);
        m = m.lerp(BLUSH, 0.55 * Math.exp(-sq(Math.hypot(x - (MX - 62), y - (MY + 22 + bob)) / 20)));
        m = m.lerp(BLUSH, 0.55 * Math.exp(-sq(Math.hypot(x - (MX + 62), y - (MY + 22 + bob)) / 20)));
        for (int s = -1; s <= 1; s += 2) {
            double ex = MX + s * 40, ey = MY - 14 + bob;
            if (open > 0.5) {
                double r = 15 * (open - 0.5) * 2;
                m = m.lerp(FACE, coverage(circle(x, y, ex, ey, Math.max(r, 3)) / px));
                m = m.lerp(WHITE, coverage(circle(x, y, ex + 5, ey - 5, Math.max(r * 0.33, 1)) / px));
            } else {
                m = m.lerp(FACE, coverage(arc(x, y, ex, ey - 6, 13, 3.2, true) / px));        // sleeping ∪ eyes
            }
        }
        m = m.lerp(FACE, coverage(arc(x, y, MX, MY + 14 + bob, 34, 4.2, true) / px));
        return c.lerp(m, inside);
    }

    /** signed distance to the lower (or upper) half of a ring - smiles and closed eyes */
    static double arc(double x, double y, double cx, double cy, double r, double thick, boolean lower) {
        double dy = y - cy;
        if (lower ? dy >= 0 : dy <= 0) return Math.abs(Math.hypot(x - cx, dy) - r) - thick;
        double e1 = Math.hypot(x - (cx - r), dy), e2 = Math.hypot(x - (cx + r), dy);
        return Math.min(e1, e2) - thick;
    }

    static double segment(double x, double y, double ax, double ay, double bx, double by) {
        double pax = x - ax, pay = y - ay, bax = bx - ax, bay = by - ay;
        double h = clamp01((pax * bax + pay * bay) / (bax * bax + bay * bay));
        return Math.hypot(pax - bax * h, pay - bay * h);
    }

    /** signed distance to a 5-pointed star (Inigo Quilez) of outer radius r, inner ratio rf */
    static double star5(double x, double y, double r, double rf) {
        final double k1x = 0.809016994375, k1y = -0.587785252292, k2x = -k1x;
        x = Math.abs(x);
        y = -y;
        double d1 = Math.max(k1x * x + k1y * y, 0);
        x -= 2 * d1 * k1x;
        y -= 2 * d1 * k1y;
        double d2 = Math.max(k2x * x + k1y * y, 0);
        x -= 2 * d2 * k2x;
        y -= 2 * d2 * k1y;
        x = Math.abs(x);
        y -= r;
        double bax = -k1y * rf, bay = k1x * rf - 1;                     // from the tip towards the inner corner
        double h = clamp((x * bax + y * bay) / (bax * bax + bay * bay), 0, r);
        double sign = Math.signum(y * bax - x * bay);
        return Math.hypot(x - bax * h, y - bay * h) * sign;
    }

    Color newStar(Color c, int k, double x, double y, double G, double px, double s) {
        double flash = pulse(G, night[k] + 0.45, 0.35);
        double sxp = STAR[k][0], syp = STAR[k][1];
        double dd = Math.hypot(x - sxp, y - syp);
        if (flash > 0.01) {                                              // a ring of sparkle when it becomes a star
            double ring = Math.abs(dd - 40 - 140 * progress(G, night[k] + 0.2, 0.8));
            c = c.add(BUG[k].add(WHITE.scale(0.3)).scale(0.9 * flash * Math.exp(-ring / 8)));
        }
        if (s <= 0.001) return c;
        double tw = 1 + 0.15 * Math.sin(G * 2.4 + k * 1.3);
        double wave = pulse(G, endFive + 1.3 + 0.35 * k, 0.3);
        for (double b : endBlinks) wave += pulse(G, b + 0.12, 0.2);
        double R = 52 * s * (tw + 0.25 * wave);
        if (dd > R * 6) return c.add(BUG[k].scale(0.5 * Math.exp(-dd / 70) * s));
        c = c.add(BUG[k].scale((0.55 + 0.5 * wave) * Math.exp(-Math.max(dd - R * 0.5, 0) / 55) * s));
        double rot = 0.15 * Math.sin(G * 1.1 + k);
        double lx = x - sxp, ly = y - syp;
        double rx = lx * Math.cos(rot) - ly * Math.sin(rot), ry = lx * Math.sin(rot) + ly * Math.cos(rot);
        double sd = star5(rx, ry, R, 0.5) - 6 * s;                         // rounded points
        double in = coverage(sd / px);
        if (in <= 0) return c;
        Color body = BUG[k].lerp(WHITE, 0.35 + 0.25 * smoothstep(0, -R, sd));
        // sleepy face: closed ∪ eyes after the final goodnight, open little dots before
        double sleepy = progress(G, endNight + 0.4, 0.5);
        double fr = R / 44;
        for (int e = -1; e <= 1; e += 2) {
            double ex = e * 11 * fr, ey = -2 * fr;
            if (sleepy < 0.5) body = body.lerp(FACE, coverage(circle(rx, ry, ex, ey, 4.6 * fr) / px));
            else body = body.lerp(FACE, coverage(arc(rx, ry, ex, ey - 2 * fr, 5 * fr, 1.6 * fr, true) / px));
        }
        body = body.lerp(FACE, coverage(arc(rx, ry, 0, 6 * fr, 6 * fr, 1.6 * fr, true) / px));
        body = body.lerp(BLUSH, 0.5 * Math.exp(-sq(Math.hypot(rx - 17 * fr, ry - 7 * fr) / (5 * fr))));
        body = body.lerp(BLUSH, 0.5 * Math.exp(-sq(Math.hypot(rx + 17 * fr, ry - 7 * fr) / (5 * fr))));
        return c.lerp(body, in);
    }

    Color grassBlades(Color c, double x, double y, double G, double px, double base, double nightAmt, double seed, double scale) {
        if (y < base - 190 * scale) return c;
        double w = 15 * scale;
        double sway = 10 * scale * Math.sin(G * 1.4 + x * 0.004 + seed) * clamp01((base - y) / (160 * scale));
        double xx = x - sway;
        double u = xx / w;
        int cell = (int) Math.floor(u);
        double f = u - cell;
        double h = (60 + 120 * hash(cell, (int) seed, 5)) * scale * (seed > 0 ? 1 : 0.55);
        double shape = 1 - Math.abs(2 * f - 1);                             // a triangle blade
        double top = base + 10 - h * shape;
        double in = coverage((top - y) / px);
        if (in <= 0) return c;
        Color blade = (seed > 0 ? Color.hex("#0A2A20") : Color.hex("#1B5A3A")).lerp(GRASS_DUSK, 1 - nightAmt);
        blade = blade.scale(0.85 + 0.35 * hash(cell, 3, (int) seed));
        // moonlit tips
        blade = blade.add(Color.hex("#4F8F8A").scale(0.25 * nightAmt * smoothstep(base - h * 0.4, top, y)));
        return c.lerp(blade, in);
    }

    Color firefly(Color c, int k, double x, double y, double G, double px, Frame fr) {
        double s = fr.bug[k];
        double[] p = fr.pos[k];
        double dx = x - p[0], dy = y - p[1];
        double d = Math.hypot(dx, dy);
        Color col = BUG[k];
        double light = fr.light[k];
        // glowing in the grass before they pop out ("who is glowing in the grass?")
        double hidden = 1 - smoothstep(fiveAppear + 0.28 * k - 0.1, fiveAppear + 0.28 * k + 0.4, G);
        if (hidden > 0) {
            double peek = smoothstep(glowing - 0.4, glowing + 0.6, G) * (k == 2 ? 1 : smoothstep(glowing + 1.2, glowing + 2.4, G));
            double pul = 0.7 + 0.3 * Math.sin(G * 5 + k);
            c = c.add(col.scale(hidden * peek * pul * (0.9 * Math.exp(-d / 40) + 0.35 * Math.exp(-d / 120))));
        }
        if (s <= 0.001) return c;
        double gs = Math.max(s, 0.0);
        // light from the tail
        double tx = p[0], ty = p[1] + 30 * gs;
        double dt = Math.hypot(x - tx, y - ty);
        c = c.add(col.scale(gs * light * (0.75 * Math.exp(-dt / 48) + 0.28 * Math.exp(-dt / 150))));
        if (d > 110 * gs) return c;
        double lx = dx / gs, ly = dy / gs, q = px / gs;                      // local units at size 1
        // wings: two soft ovals, fluttering
        double flap = 1 + 0.3 * Math.sin(G * 28 + k);
        for (int e = -1; e <= 1; e += 2) {
            double wx = (lx - e * 30) / 1.0, wy = (ly + 34) / flap;
            double rot = e * 0.5;
            double ux = wx * Math.cos(rot) + wy * Math.sin(rot), uy = -wx * Math.sin(rot) + wy * Math.cos(rot);
            double wd = (Math.hypot(ux / 18, uy / 28) - 1) * 18;
            c = c.lerp(Color.hex("#DDEBFF"), 0.45 * coverage(wd / q));
            c = c.lerp(Color.hex("#FFFFFF"), 0.5 * coverage((Math.abs(wd + 1.5) - 1.2) / q));
        }
        // glowing tail
        double tail = circle(lx, ly, 0, 32, 25);
        Color tailC = col.lerp(WHITE, 0.45 + 0.2 * Math.min(light - 1, 1)).add(WHITE.scale(0.15 * light));
        c = c.lerp(tailC, coverage(tail / q));
        // antennae
        for (int e = -1; e <= 1; e += 2) {
            double ad = segment(lx, ly, e * 10, -30, e * 22, -60) - 2.6;
            c = c.lerp(FACE, coverage(ad / q));
            c = c.lerp(col.lerp(WHITE, 0.3), coverage(circle(lx, ly, e * 23, -62, 6.5) / q));
        }
        // head
        double head = circle(lx, ly, 0, -4, 33);
        double shade = smoothstep(-30, 30, lx * 0.4 + ly * 0.6);
        Color headC = col.scale(1.0 - 0.28 * shade).lerp(WHITE, 0.25 * Math.exp(-sq(Math.hypot(lx + 12, ly + 18) / 10)));
        double hin = coverage(head / q);
        if (hin <= 0) return c;
        // eyes
        double closed = fr.closed[k];
        for (int e = -1; e <= 1; e += 2) {
            double ex = e * 13, ey = -8;
            if (closed > 0.5) {
                headC = headC.lerp(FACE, coverage(arc(lx, ly, ex, ey - 3, 7, 1.9, true) / q));
            } else {
                headC = headC.lerp(WHITE, coverage(circle(lx, ly, ex, ey, 10.5) / q));
                double look = 1.5 * Math.sin(G * 0.7 + k);
                headC = headC.lerp(FACE, coverage(circle(lx, ly, ex + look, ey + 1.5, 6.5) / q));
                headC = headC.lerp(WHITE, coverage(circle(lx, ly, ex + look + 2.5, ey - 1.5, 2.2) / q));
            }
        }
        headC = headC.lerp(FACE, coverage(arc(lx, ly, 0, 7, 9, 2.0, true) / q));
        headC = headC.lerp(BLUSH, 0.55 * Math.exp(-sq(Math.hypot(lx - 22, ly - 6) / 6)));
        headC = headC.lerp(BLUSH, 0.55 * Math.exp(-sq(Math.hypot(lx + 22, ly - 6) / 6)));
        return c.lerp(headC, hin);
    }

    // ================= overlays: the numbers =================

    double[] toScreen(double wx, double wy, double G) {
        double[] cam = camera(G);
        double k = cam[2] * width / 1920d;
        return new double[]{(wx - cam[0]) * k + width / 2d, (wy - cam[1]) * k + height / 2d, k};
    }

    @Override
    public void overlay(ImageWriter w, double t) {
        double G = t0 + t;
        // counting: a number pops over each firefly on its word
        double countFade = 1 - progress(G, dance - 0.2, 0.5);
        for (int i = 0; i < 5; ++i) {
            double pop = easeOutBack(progress(G, countAt[i] + 0.02, 0.35));
            if (pop <= 0 || countFade <= 0) continue;
            double[] p = position(i, G);
            double[] s = toScreen(p[0], p[1] - 120, G);
            Font f = digits.deriveFont((float) (70 * s[2] * pop));
            w.drawGlowText(String.valueOf(i + 1), f, WHITE, s[0], s[1], BUG[i], (int) Math.max(4, 10 * s[2]), countFade);
        }
        // each verse: its big number shines in the sky
        int k = verseOf(shot);
        if (k >= 0 && shot.endsWith("-a")) {
            double start = at(VERSE[k], VERSE[k], 1);
            double pop = easeOutBack(progress(G, start, 0.45));
            double fade = 1 - progress(G, start + 3.8, 0.6);
            if (pop > 0 && fade > 0) {
                Font f = digits.deriveFont((float) (330 * pop * width / 1920d));
                w.drawGlowText(DIGIT[k], f, Color.hex("#FFF3C4"), width * 0.5, height * 0.25, BUG[k], 26, fade);
            }
        }
    }
}
