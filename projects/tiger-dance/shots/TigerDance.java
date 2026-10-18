import imagewriter.*;
import static imagewriter.Paint.*;

public class TigerDance extends Painting {
    static final Color ORG = Color.hex("#FF9A1F"), DK = Color.hex("#3A1F10"), CRM = Color.hex("#FFF4E0"),
            PINK = Color.hex("#FF8FA3"), SKIN = Color.hex("#FFD0AC"), HAIR = Color.hex("#6B4226"),
            NAVY = Color.hex("#2B3A5E"), JEAN = Color.hex("#3F73B0"), WHITE = Color.hex("#FFFFFF");

    static double ell(double X, double Y, double cx, double cy, double a, double b) {
        return (Math.hypot((X - cx) / a, (Y - cy) / b) - 1) * Math.min(a, b);
    }
    static double cap(double X, double Y, double ax, double ay, double bx, double by, double r) {
        return segment(X, Y, ax, ay, bx, by) - r;
    }
    static Color put(Color c, double d, Color fill) {
        Color f = fill.scale(0.8 + 0.2 * smoothstep(0, 30, -d));
        return c.lerp(f, coverage(d));
    }
    static Color flat(Color c, double d, Color fill) { return c.lerp(fill, coverage(d)); }

    @Override public Color pixel(double x, double y, double t) {
        double S = width / 1080d;
        double X = x / S, Y = y / S;
        double beat = 2 * Math.PI * 2 * t;

        // ---- wall
        Color c = Color.hex("#7DBBE6").lerp(Color.hex("#4E8DC6"), smoothstep(0, 1500, Y));
        c = c.add(Color.hex("#FFF3C4").scale(0.22 * Math.exp(-Math.hypot(X - 120, Y - 300) / 380)));
        double[][] dec = {{140, 200}, {420, 120}, {760, 260}, {960, 130}, {110, 520}, {930, 560}, {330, 700}, {1000, 840}};
        for (double[] p : dec) {
            double bob = 6 * Math.sin(beat / 2 + p[0]);
            double yy = p[1] + bob;
            c = put(c, circle(X, Y, p[0] - 26, yy - 24, 12), ORG);
            c = put(c, circle(X, Y, p[0] + 26, yy - 24, 12), ORG);
            c = put(c, circle(X, Y, p[0], yy, 34), ORG);
            c = flat(c, ell(X, Y, p[0], yy + 12, 18, 13), CRM);
            c = flat(c, circle(X, Y, p[0] - 12, yy - 6, 4), DK);
            c = flat(c, circle(X, Y, p[0] + 12, yy - 6, 4), DK);
            c = flat(c, ell(X, Y, p[0], yy + 6, 6, 4), DK);
        }
        // ---- sofa
        c = put(c, roundBox(X, Y, 540, 1250, 590, 190, 60), Color.hex("#3E78B8"));
        c = put(c, roundBox(X, Y, 250, 1250, 190, 110, 40), Color.hex("#4F8AC9"));
        c = put(c, roundBox(X, Y, 830, 1250, 190, 110, 40), Color.hex("#4F8AC9"));
        c = put(c, roundBox(X, Y, 540, 1420, 570, 80, 36), Color.hex("#5A95D2"));
        // ---- floor with perspective tiles
        if (Y > 1440) {
            double k = Y - 1380;
            Color fl = Color.hex("#EBD9B4").lerp(Color.hex("#D2BC92"), smoothstep(1440, 1920, Y));
            double gx = Math.abs(((X - 540) / k * 3 % 1 + 1) % 1 - 0.5), gy = Math.abs((300 / k * 0.45 % 1 + 1) % 1 - 0.5);
            double line = Math.max(smoothstep(0.47, 0.5, gx), smoothstep(0.47, 0.5, gy));
            c = c.lerp(fl.scale(1 - 0.12 * line), smoothstep(1436, 1446, Y));
        }
        // ---- shadows
        c = c.scale(1 - 0.35 * coverage(ell(X, Y, 700, 1490, 250, 30) + 25 - 40 * 0));
        c = c.scale(1 - 0.32 * smoothstep(40, 0, ell(X, Y, 330, 1568, 200, 28)));

        // ---- TIGER (pivot at feet, tilts + bounces out of phase)
        {
            double ang = 0.05 * Math.sin(beat / 2 + Math.PI), px0 = 700, py0 = 1480;
            double dy = -22 * Math.abs(Math.sin(beat / 2 + 0.6));
            double dx = X - px0, dyy = Y - py0 - dy;
            double tx = px0 + Math.cos(ang) * dx + Math.sin(ang) * dyy, ty = py0 - Math.sin(ang) * dx + Math.cos(ang) * dyy;
            double wv = Math.sin(beat / 2 * 1.0), wv2 = Math.sin(beat / 2 + 1.5);
            double u = tx, v = ty;
            // tail
            double tl = 0;
            Color o = ORG;
            double tt = Math.min(Math.min(cap(u, v, 850, 1330, 960, 1280 + 30 * wv, 26), cap(u, v, 960, 1280 + 30 * wv, 1010, 1160 + 40 * wv, 24)),
                    cap(u, v, 1010, 1160 + 40 * wv, 990, 1080 + 40 * wv, 22));
            c = put(c, tt, o);
            c = flat(c, max2(circle(u, v, 990, 1080 + 40 * wv, 30), -1e9) , DK);
            // legs and feet
            c = put(c, cap(u, v, 620, 1380, 610, 1450, 58), o);
            c = put(c, cap(u, v, 780, 1380, 800, 1450, 58), o);
            c = put(c, ell(u, v, 600, 1475, 80, 34), CRM);
            c = put(c, ell(u, v, 815, 1475, 80, 34), CRM);
            // body
            double bd = ell(u, v, 700, 1190, 205, 265);
            c = put(c, bd, o);
            c = flat(c, ell(u, v, 700, 1240, 130, 185), CRM.lerp(Color.hex("#FFE2B0"), 0.3));
            for (int k = 0; k < 5; k++) {
                double sy = 1040 + k * 62;
                c = flat(c, Math.max(cap(u, v, 480, sy, 570, sy + 14, 10), bd), DK);
                c = flat(c, Math.max(cap(u, v, 930, sy, 840, sy + 14, 10), bd), DK);
            }
            // left arm (toward baby, waving)
            c = put(c, cap(u, v, 540, 1110, 450, 1190 + 30 * wv2, 44), o);
            c = put(c, circle(u, v, 440, 1200 + 30 * wv2, 48), CRM);
            // head
            double hy = 800 + 6 * Math.sin(beat);
            double hs = hy - 800;
            c = put(c, circle(u, v, 540, 630 + hs, 76), o);
            c = put(c, circle(u, v, 860, 630 + hs, 76), o);
            c = flat(c, circle(u, v, 540, 640 + hs, 42), PINK);
            c = flat(c, circle(u, v, 860, 640 + hs, 42), PINK);
            double hd = ell(u, v, 700, hy, 245, 215);
            c = put(c, hd, o);
            // forehead stripes
            c = flat(c, Math.max(cap(u, v, 700, 610 + hs, 700, 690 + hs, 12), hd), DK);
            c = flat(c, Math.max(cap(u, v, 640, 622 + hs, 650, 680 + hs, 10), hd), DK);
            c = flat(c, Math.max(cap(u, v, 760, 622 + hs, 750, 680 + hs, 10), hd), DK);
            // cheek stripes
            for (int s = -1; s <= 1; s += 2) {
                c = flat(c, Math.max(cap(u, v, 700 + s * 240, 780 + hs, 700 + s * 175, 800 + hs, 9), hd), DK);
                c = flat(c, Math.max(cap(u, v, 700 + s * 240, 850 + hs, 700 + s * 180, 850 + hs, 9), hd), DK);
            }
            // muzzle + cheeks
            c = flat(c, ell(u, v, 640, 905 + hs, 85, 62), CRM);
            c = flat(c, ell(u, v, 760, 905 + hs, 85, 62), CRM);
            c = flat(c, ell(u, v, 700, 880 + hs, 105, 80), CRM);
            // eyes
            for (int s = -1; s <= 1; s += 2) {
                double ex = 700 + s * 85, ey = 770 + hs;
                c = flat(c, ell(u, v, ex, ey, 58, 70), WHITE);
                c = flat(c, circle(u, v, ex - 14, ey + 4, 36), Color.hex("#6B3A12"));
                c = flat(c, circle(u, v, ex - 14, ey + 4, 22), Color.hex("#140A05"));
                c = flat(c, circle(u, v, ex - 24, ey - 10, 10), WHITE);
                c = flat(c, circle(u, v, ex - 4, ey + 16, 5), WHITE);
                c = flat(c, cap(u, v, ex - 55, ey - 92 - 8 * s, ex + 55, ey - 92 + 8 * s, 8), DK);
            }
            // nose, mouth
            c = put(c, ell(u, v, 700, 860 + hs, 36, 25), PINK.scale(0.9));
            double md = Math.max(ell(u, v, 700, 925 + hs, 78, 62), 925 + hs - v);
            c = flat(c, md, Color.hex("#5A1520"));
            c = flat(c, Math.max(ell(u, v, 700, 985 + hs, 42, 30), md), Color.hex("#FF7A8E"));
            c = flat(c, cap(u, v, 700, 885 + hs, 700, 925 + hs, 4), DK);
            // right arm (raised, waving)
            double aw = Math.sin(beat / 2 * 2 + 0.5);
            c = put(c, cap(u, v, 860, 1110, 960, 960 + 40 * aw, 44), o);
            c = put(c, circle(u, v, 968, 945 + 40 * aw, 48), CRM);
        }

        // ---- BABY
        {
            double ang = 0.07 * Math.sin(beat / 2), px0 = 330, py0 = 1560;
            double dy = -30 * Math.abs(Math.sin(beat / 2));
            double dx = X - px0, dyy = Y - py0 - dy;
            double u = px0 + Math.cos(ang) * dx + Math.sin(ang) * dyy, v = py0 - Math.sin(ang) * dx + Math.cos(ang) * dyy;
            double w1 = Math.sin(beat / 2 + 0.8), w2 = Math.sin(beat / 2 + 3.9);
            // legs + shoes
            c = put(c, cap(u, v, 285, 1400, 270, 1520, 50), JEAN);
            c = put(c, cap(u, v, 375, 1400, 395 + 10 * w1, 1520, 50), JEAN);
            c = put(c, ell(u, v, 262, 1555, 66, 36), Color.hex("#F4F4F8"));
            c = flat(c, ell(u, v, 262, 1578, 66, 12), Color.hex("#B9BDC9"));
            c = put(c, ell(u, v, 405 + 10 * w1, 1555, 66, 36), Color.hex("#F4F4F8"));
            c = flat(c, ell(u, v, 405 + 10 * w1, 1578, 66, 12), Color.hex("#B9BDC9"));
            // torso
            double td = roundBox(u, v, 330, 1290, 105, 120, 45);
            c = put(c, td, WHITE);
            double st = smoothstep(-1, 1, Math.sin(v * 0.115) * 6);
            c = flat(c, Math.max(td, -(st - 0.5) * 40 + 0 * v) , NAVY.scale(1));
            c = put(c, roundBox(u, v, 330, 1390, 108, 50, 24), JEAN);
            // arms (sleeves + hands)
            double ax1 = 160 - 12 * w1, ay1 = 1320 - 70 * (0.5 + 0.5 * w1);
            c = put(c, cap(u, v, 240, 1230, ax1, ay1, 36), WHITE);
            c = flat(c, Math.max(cap(u, v, 240, 1230, ax1, ay1, 36), -(Math.sin((u + v) * 0.12)) * 20), NAVY);
            c = put(c, circle(u, v, ax1 - 6, ay1 + 14, 34), SKIN);
            double ax2 = 500, ay2 = 1230 - 60 * (0.5 + 0.5 * w2);
            c = put(c, cap(u, v, 420, 1230, ax2, ay2, 36), WHITE);
            c = flat(c, Math.max(cap(u, v, 420, 1230, ax2, ay2, 36), -(Math.sin((u + v) * 0.12)) * 20), NAVY);
            c = put(c, circle(u, v, ax2 + 8, ay2 - 6, 34), SKIN);
            // head
            double hy = 1010;
            c = put(c, circle(u, v, 162, hy + 20, 32), SKIN);
            c = put(c, circle(u, v, 498, hy + 20, 32), SKIN);
            double hd = circle(u, v, 330, hy, 172);
            c = put(c, hd, SKIN);
            double hair = Math.max(circle(u, v, 330, hy - 14, 182), v - (925 + 38 * Math.sin((u - 330) * 0.035 + 0.6) + 22 * Math.sin((u - 330) * 0.09)));
            c = put(c, hair, HAIR);
            c = flat(c, circle(u, v, 345, 840, 22), HAIR);
            c = flat(c, circle(u, v, 238, 1065, 34) - 0, SKIN.lerp(PINK, 0.0));
            for (int s = -1; s <= 1; s += 2) {
                double ex = 330 + s * 58, ey = 1030;
                c = flat(c, ell(u, v, ex + s * 70, ey + 50, 36, 24), PINK.lerp(SKIN, 0.55));
                c = flat(c, ell(u, v, ex, ey, 40, 50), WHITE);
                c = flat(c, circle(u, v, ex + 4 * s, ey + 6, 30), Color.hex("#5A3416"));
                c = flat(c, circle(u, v, ex + 4 * s, ey + 6, 18), Color.hex("#120A05"));
                c = flat(c, circle(u, v, ex - 8 + 4 * s, ey - 8, 9), WHITE);
                c = flat(c, cap(u, v, ex - 36, ey - 62, ex + 36, ey - 62 + 6 * s, 5), HAIR);
            }
            c = flat(c, ell(u, v, 330, 1075, 12, 8), SKIN.scale(0.85));
            double md = Math.max(ell(u, v, 330, 1110, 52, 40), 1105 - v);
            c = flat(c, md, Color.hex("#5A1520"));
            c = flat(c, Math.max(ell(u, v, 330, 1148, 28, 20), md), Color.hex("#FF7A8E"));
        }

        // finish: vignette
        double vg = Math.hypot((X - 540) / 700, (Y - 960) / 1200);
        c = c.scale(1 - 0.28 * smoothstep(0.55, 1.2, vg));
        return c;
    }
    static double max2(double a, double b) { return Math.max(a, b); }
}
