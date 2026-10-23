import imagewriter.*;
import static imagewriter.Paint.*;

// A tangled jungle: hazy trunks in five depth layers, drifting light shafts, a leafy canopy with a sun gap,
// a toucan on a branch high in the trees, big dark leaves in front. Every pixel is a formula of (x, y).
public class Jungle extends Painting {
    private static final Color DARK = Color.hex("#0E2E17"), LIGHT = Color.hex("#DDE59C"), WARM = Color.hex("#FFD580");
    private static final Color SKY = Color.hex("#9CCFE6"), SUNW = Color.hex("#FFF8DA");
    private double W, H, sx, sy, tx, ty, S;
    private double[][] leaves;

    @Override protected void setup() {
        W = width; H = height;
        sx = 0.64 * W; sy = 0.15 * H;
        S = 0.088 * H;                       // toucan body scale
        tx = 0.37 * W; ty = branchY(tx) - 0.017 * H;
        // base x, base y (fractions), angle (deg, 0 = right, 90 = up), length, half width (fractions of H)
        double[][] p = {
            {-0.02, 1.03, -60, 0.70, 0.085}, {0.00, 1.04, -35, 0.78, 0.095}, {0.03, 1.05, -80, 0.60, 0.07},
            {-0.03, 1.00, -12, 0.55, 0.075}, {0.10, 1.06, -62, 0.42, 0.06},
            {1.02, 1.03, -120, 0.72, 0.09}, {1.00, 1.05, -145, 0.80, 0.10}, {0.97, 1.06, -100, 0.62, 0.075},
            {1.03, 1.00, -168, 0.56, 0.08}, {0.90, 1.06, -118, 0.45, 0.06},
            {0.45, 1.08, -88, 0.28, 0.045}, {0.60, 1.08, -96, 0.30, 0.05}
        };
        leaves = p;
    }

    private double branchY(double x) { return 0.42 * H - 0.11 * H * (x / W) + 0.012 * H * Math.sin(x / W * 7); }

    // ---------- background: misty green below, sky + sun glow in the gaps above
    private Color bg(double x, double y) {
        double v = y / H, rs = Math.hypot(x - sx, y - sy), glow = Math.exp(-rs / (0.55 * H));
        Color haze = DARK.lerp(LIGHT, clamp01(0.08 + 0.8 * glow + 0.25 * fbm(x * 0.003, y * 0.003, 2, 3)));
        Color sky = SKY.lerp(SUNW, clamp01(Math.pow(glow, 0.6) * 1.2));
        double skyW = 1 - smoothstep(0.04, 0.5, v);
        Color c = haze.lerp(sky, skyW * 0.9);
        double disc = coverage(circle(x, y, sx, sy, 0.02 * H));
        return c.lerp(Color.WHITE, disc);
    }

    // ---------- tree trunks, one depth layer (0 far .. 4 near) + hanging vines
    private Color trunkLayer(Color c, double x, double y, int i) {
        double depth = i / 4.0;
        double P = H * (0.10 + 0.16 * depth * depth + 0.03 * depth);
        double sway = (fbm(y * 0.0016 + i * 5, i * 3.1, 0, 2) - 0.5) * P * 0.7;
        double xx = x + i * 137.0 + sway;
        int cell = (int) Math.floor(xx / P);
        Color res = c;
        double rs = Math.hypot(x - sx, y - sy), glow = Math.exp(-rs / (0.55 * H));
        Color fogC = bg(x, y);
        double fog = 0.12 + 0.78 * Math.pow(1 - depth, 1.3);
        for (int k = -1; k <= 1; k++) {
            int cc = cell + k;
            if (hash(cc, i, 11) > 0.58) continue;
            double center = (cc + 0.15 + 0.7 * hash(cc, i, 3)) * P;
            double w = P * (0.07 + 0.12 * hash(cc, i, 5)) * (0.7 + 0.9 * depth) * (1 + 0.25 * y / H);
            double d = Math.abs(xx - center) - w * 0.5;
            double cov = coverage(d);
            if (cov <= 0) continue;
            double u = (xx - center) / (w * 0.5);
            double bark = fbm(xx * 0.09, y * 0.006 + hash(cc, i, 7) * 10, i, 4);
            double ridges = 0.5 + 0.5 * Math.sin(u * 5 + bark * 6);
            Color base = Color.hex("#17120D").lerp(Color.hex("#4A4A24"), clamp01(bark * 0.9 + 0.15 * ridges));
            base = base.lerp(Color.hex("#3F7A22"), clamp01((fbm(xx * 0.03, y * 0.01, i + 9, 3) - 0.5) * 1.8) * 0.65);
            double sgn = Math.signum(sx - center), lit = clamp01(0.5 + 0.5 * u * sgn);
            base = base.scale(0.3 + 1.0 * lit * lit);
            base = base.add(WARM.scale(0.55 * smoothstep(0.65, 1.0, u * sgn) * (0.35 + glow)));
            base = base.lerp(fogC, fog);
            res = res.lerp(base, cov);
        }
        if (i >= 2) {                                    // hanging vines
            double pv = P * 0.33;
            int vc = (int) Math.floor(x / pv);
            for (int k = -1; k <= 1; k++) {
                int cc = vc + k;
                if (hash(cc, i, 21) > 0.45) continue;
                double end = H * (0.30 + 0.55 * hash(cc, i, 22));
                double vx = (cc + 0.5) * pv + Math.sin(y * 0.011 + hash(cc, i, 23) * 6.28) * P * 0.06;
                double d = Math.abs(x - vx) - (1.0 + 1.6 * depth);
                double cov = coverage(d) * (1 - smoothstep(end - 30, end, y));
                if (cov > 0) res = res.lerp(Color.hex("#16361A").lerp(fogC, fog * 0.8), cov);
            }
        }
        return res;
    }

    // ---------- light shafts from the sun, drifting dust
    private Color shafts(Color c, double x, double y) {
        double dx = x - sx, dy = y - sy, rs = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
        double sh = 0.5 * noise(ang * 9, 3, 0) + 0.35 * noise(ang * 26, 7, 0) + 0.35 * noise(ang * 70, 11, 0) - 0.12;
        sh = Math.pow(clamp01(sh), 2.0) * Math.exp(-rs / (1.2 * H)) * smoothstep(0.02 * H, 0.3 * H, rs);
        sh *= (0.5 + 1.0 * fbm(x * 0.004, y * 0.0045, 5, 3)) * smoothstep(sy - 0.02 * H, sy + 0.15 * H, y);
        return c.add(WARM.scale(0.62 * sh));
    }

    // ---------- one leaf per grid cell, hanging: returns {coverage, random, along 0..1, across -1..1}
    private double[] leaf(double x, double y, double g, int seed) {
        int cx = (int) Math.floor(x / g), cy = (int) Math.floor(y / g);
        double best = 1e9;
        double[] out = {0, 0, 0, 0};
        for (int j = -1; j <= 1; j++)
            for (int i = -1; i <= 1; i++) {
                int ix = cx + i, iy = cy + j;
                double px = (ix + hash(ix, iy, seed)) * g, py = (iy + hash(ix, iy, seed + 1)) * g;
                double ang = -Math.PI / 2 + (hash(ix, iy, seed + 2) - 0.5) * 3.4;
                double L = g * (0.9 + 1.1 * hash(ix, iy, seed + 3)), hw = L * (0.17 + 0.1 * hash(ix, iy, seed + 4));
                double ca = Math.cos(ang), sa = Math.sin(ang), dx = x - px, dy = y - py;
                double a = dx * ca + dy * sa, b = -dx * sa + dy * ca, t = a / L;
                if (t < 0 || t > 1) continue;
                double w = hw * Math.pow(Math.sin(Math.PI * t), 0.7);
                double d = Math.abs(b) - w;
                if (d < best) { best = d; out[0] = coverage(d); out[1] = hash(ix, iy, seed + 5); out[2] = t; out[3] = b / Math.max(w, 0.5); }
            }
        return out;
    }

    // ---------- canopy: three layers of real leaves, backlit rims, a sun gap and a window round the toucan
    private Color canopy(Color c, double x, double y) {
        double v = y / H, rs = Math.hypot(x - sx, y - sy), glow = Math.exp(-rs / (0.8 * H));
        double tg = Math.hypot((x - tx) / 1.5, y - (ty - 1.8 * S));
        for (int layer = 0; layer < 3; layer++) {
            double sc = 1.0 + 0.7 * layer;
            double g = H * (0.085 - 0.025 * layer);
            double dens = (1 - smoothstep(0.02, 0.70, v - 0.05 * layer)) * 1.12;
            double q = dens + (fbm(x * 0.0045 * sc, y * 0.0058 * sc, 20 + layer * 7, 5) - 0.5) * 0.9;
            double rsw = rs * (0.7 + 0.7 * fbm(x * 0.008, y * 0.008, 15, 4));
            q -= 1.7 * Math.exp(-sq(rsw / (0.17 * H)));
            if (layer > 0) q -= 0.55 * smoothstep(0.62, 0.72, fbm(x * 0.006, y * 0.006, 33 + layer, 3));
            q -= 0.85 * Math.exp(-tg / (0.12 * H)) * (1 - 0.3 * layer);
            double[] lf = leaf(x, y, g, 100 * layer + 7);
            double qq = q + (lf[0] - 0.5) * 0.5;
            double mass = smoothstep(0.47, 0.53, qq);
            double rim = Math.exp(-sq((qq - 0.5) / 0.045));
            double rib = Math.exp(-sq(lf[3] / 0.09)) * lf[0];
            double sunK = Math.exp(-rs / (0.95 * H));
            Color dark = Color.hex("#031009").lerp(Color.hex("#0B2A12"), fbm(x * 0.03, y * 0.03, 70 + layer, 3));
            Color leafC = Color.hex("#062010").lerp(Color.hex("#2E6A1B"), clamp01(0.1 + 0.7 * lf[1] + 0.3 * lf[2] * sunK));
            leafC = leafC.lerp(Color.hex("#9BCB3A"), rib * 0.5 * (0.3 + sunK));
            leafC = leafC.add(Color.hex("#A5D43A").scale(sunK * sunK * sunK * 0.55 * lf[0] * (0.2 + lf[2])));
            Color base = dark.lerp(leafC, lf[0]);
            
            c = c.lerp(base, mass);
            c = c.add(Color.hex("#E2F27A").scale(rim * mass * (0.2 + glow * 1.4)));
        }
        return c;
    }

    // ---------- clumps of leaves hanging in the mid-ground and at the branch ends
    private Color understory(Color c, double x, double y) {
        double[] lf = leaf(x, y, 0.036 * H, 300);
        double m = fbm(x * 0.006, y * 0.007, 90, 4);
        double bx = branchY(x);
        double branchEnd = Math.exp(-sq((y - bx) / (0.1 * H))) * (smoothstep(0.55 * W, 0.68 * W, x) + 1 - smoothstep(0.0, 0.1 * W, x));
        double mask = smoothstep(0.62, 0.72, m + 0.5 * branchEnd - 0.12 * (1 - smoothstep(0.25, 0.8, y / H)) * 0) * lf[0];
        if (mask <= 0) return c;
        double rs = Math.hypot(x - sx, y - sy), sunK = Math.exp(-rs / (0.9 * H));
        Color col = Color.hex("#07210D").lerp(Color.hex("#356F1E"), clamp01(0.15 + 0.6 * lf[1] + 0.25 * sunK));
        col = col.lerp(Color.hex("#A3D043"), Math.exp(-sq(lf[3] / 0.1)) * 0.4 * sunK);
        col = col.add(WARM.scale(0.3 * sunK * lf[2]));
        col = col.lerp(bg(x, y), branchEnd > 0.1 ? 0.0 : 0.35);
        return c.lerp(col, mask);
    }

    // ---------- branch
    private double[] branch(double x, double y) {           // {alpha, shade}
        double x0 = -0.05 * W, x1 = 0.66 * W;
        double ax = x0, ay = branchY(x0), bx = x1, by = branchY(x1);
        double px = x - ax, py = y - ay, ux = bx - ax, uy = by - ay;
        double k = clamp01((px * ux + py * uy) / (ux * ux + uy * uy));
        double cx = ax + k * ux, cy = branchY(cx);
        double d = Math.hypot(x - cx, y - cy) - mix(0.034 * H, 0.009 * H, Math.pow(k, 0.8));
        return new double[]{coverage(d), k};
    }

    private Color branchColor(Color c, double x, double y) {
        double[] b = branch(x, y);
        if (b[0] <= 0) return c;
        double[] up = branch(x + 3, y + 5);
        double rimK = clamp01(b[0] - up[0]);
        double tex = fbm(x * 0.06, y * 0.2, 50, 4);
        Color col = Color.hex("#241810").lerp(Color.hex("#5D4A2B"), tex);
        double lit = 0.5 + 0.5 * (b[0] - branch(x - 3, y - 6)[0]);
        col = col.scale(0.55 + 0.6 * clamp01(lit));
        col = col.add(WARM.scale(rimK * 0.9));
        return c.lerp(col, b[0]);
    }

    // ---------- toucan
    private double ell(double X, double Y, double cx, double cy, double a, double b, double rotDeg) {
        double r = Math.toRadians(rotDeg), ca = Math.cos(r), sa = Math.sin(r);
        double u = (X - cx) * ca + (Y - cy) * sa, w = -(X - cx) * sa + (Y - cy) * ca;
        return (Math.sqrt(sq(u / a) + sq(w / b)) - 1) * Math.min(a, b);
    }

    private double beakK(double X, double Y, double[] out) {   // returns signed distance, out[0] = k along the beak
        double x0 = 0.9 * S, y0 = 2.18 * S, x1 = 1.9 * S, y1 = 2.2 * S, x2 = 3.0 * S, y2 = 1.7 * S;
        double best = 1e9, bk = 0;
        for (int s = 0; s < 2; s++) {
            double ax = s == 0 ? x0 : x1, ay = s == 0 ? y0 : y1, bx = s == 0 ? x1 : x2, by = s == 0 ? y1 : y2;
            double ux = bx - ax, uy = by - ay, k = clamp01(((X - ax) * ux + (Y - ay) * uy) / (ux * ux + uy * uy));
            double kk = (s + k) / 2;
            double d = Math.hypot(X - (ax + k * ux), Y - (ay + k * uy)) - mix(0.44 * S, 0.07 * S, Math.pow(kk, 0.8));
            if (d < best) { best = d; bk = kk; }
        }
        out[0] = bk;
        return best;
    }

    private double toucanAlpha(double x, double y) {
        double X = x - tx, Y = ty - y;
        if (X < -1.8 * S || X > 3.5 * S || Y < -0.6 * S || Y > 3.2 * S) return 0;
        double d = Math.min(ell(X, Y, 0, 1.1 * S, 0.7 * S, 1.25 * S, -20), circle(X, Y, 0.55 * S, 2.15 * S, 0.55 * S));
        d = Math.min(d, segDist(X, Y, -0.4 * S, 0.6 * S, -1.5 * S, -0.3 * S) - 0.2 * S);
        double[] o = new double[1];
        d = Math.min(d, beakK(X, Y, o));
        return coverage(d);
    }

    private double segDist(double X, double Y, double ax, double ay, double bx, double by) {
        return segment(X, Y, ax, ay, bx, by);
    }

    private Color toucanColor(Color c, double x, double y) {
        double a0 = toucanAlpha(x, y);
        if (a0 <= 0) return c;
        double X = x - tx, Y = ty - y;
        Color col = Color.hex("#0B0B10");
        // tail + red under-tail
        double dt = segDist(X, Y, -0.4 * S, 0.6 * S, -1.5 * S, -0.3 * S) - 0.2 * S;
        col = col.lerp(Color.hex("#0B0B10"), coverage(dt));
        double dred = circle(X, Y, -0.2 * S, 0.5 * S, 0.24 * S);
        col = col.lerp(Color.hex("#E02A22"), coverage(dred) * 0.95);
        double dbody = ell(X, Y, 0, 1.1 * S, 0.7 * S, 1.25 * S, -20);
        double bodyShade = 0.6 + 0.6 * clamp01(0.5 + 0.5 * (X / S));
        col = col.lerp(Color.hex("#0B0B10").lerp(Color.hex("#1B1D26"), clamp01(0.6 * (Y / S - 0.5))), coverage(dbody));
        // yellow-white bib
        double dbib = ell(X, Y, 0.52 * S, 1.72 * S, 0.48 * S, 0.62 * S, -10);
        Color bib = Color.hex("#FFE266").lerp(Color.hex("#FFF6C8"), clamp01(0.4 + 0.5 * (Y / S - 1.4)));
        col = col.lerp(bib, coverage(dbib));
        // head
        double dh = circle(X, Y, 0.55 * S, 2.15 * S, 0.55 * S);
        double headMask = coverage(dh) * (1 - coverage(dbib + 0.02 * S) * clamp01((1.95 * S - Y) / (0.4 * S)));
        col = col.lerp(Color.hex("#0B0B10"), coverage(dh) * 0.95);
        col = col.lerp(bib, coverage(dbib) * clamp01((1.95 * S - Y) / (0.35 * S) + 0.3));
        // beak
        double[] o = new double[1];
        double db = beakK(X, Y, o), k = o[0];
        double across = (Y - (2.18 * S - 0.6 * S * k * k)) / (0.44 * S * (1 - k) + 0.07 * S);
        Color beak = Color.hex("#F6C93A").lerp(Color.hex("#EE7F1B"), clamp01(0.5 - 0.6 * across + 0.5 * k));
        beak = beak.lerp(Color.hex("#F2E36B"), clamp01(0.5 - 0.9 * across) * (1 - k) * 0.5);
        beak = beak.lerp(Color.hex("#A7241C"), smoothstep(0.80, 0.9, k));
        beak = beak.lerp(Color.hex("#0B0B10"), 1 - smoothstep(0.02, 0.1, k));
        double lowerLine = Math.exp(-sq((across - 0.05) / 0.045)) * 0.55 * (1 - k);
        beak = beak.lerp(Color.hex("#3A200C"), clamp01(lowerLine));
        beak = beak.scale(0.8 + 0.3 * clamp01(0.5 - 0.5 * across));
        col = col.lerp(beak, coverage(db));
        // eye
        col = col.lerp(Color.hex("#3FB0E4"), coverage(circle(X, Y, 0.76 * S, 2.3 * S, 0.19 * S)));
        col = col.lerp(Color.hex("#050507"), coverage(circle(X, Y, 0.78 * S, 2.3 * S, 0.095 * S)));
        col = col.lerp(Color.WHITE, coverage(circle(X, Y, 0.74 * S, 2.34 * S, 0.03 * S)) * 0.9);
        // backlight: warm rim on the sun-facing edge, glow tint
        double rim = clamp01(a0 - toucanAlpha(x + 4, y - 5));
        col = col.add(WARM.scale(rim * 1.1));
        col = col.add(Color.hex("#6B5524").scale(0.18));
        return c.lerp(col, a0);
    }

    // ---------- foreground leaves
    private Color foreground(Color c, double x, double y) {
        double rs = Math.hypot(x - sx, y - sy), glow = Math.exp(-rs / (0.9 * H));
        for (double[] lf : leaves) {
            double bx = lf[0] * W, by = lf[1] * H, L = lf[3] * H, hw0 = lf[4] * H, ang = Math.toRadians(lf[2]);
            double ca = Math.cos(ang), sa = Math.sin(ang), dx = x - bx, dy = y - by;
            double a = dx * ca + dy * sa, b = -dx * sa + dy * ca;
            double t = a / L;
            if (t < 0 || t > 1) continue;
            double bend = (lf[0] < 0.5 ? 1 : -1) * 0.22;
            double bb = b - bend * t * t * L * 0.5;
            double hw = hw0 * Math.pow(Math.sin(Math.PI * clamp01(t * 0.97 + 0.015)), 0.8) * (1 - 0.2 * t);
            double d = Math.abs(bb) - hw;
            double cov = coverage(d);
            if (cov <= 0) continue;
            double side = bb / Math.max(hw, 1);
            Color base = Color.hex("#031208").lerp(Color.hex("#1D5C1E"), clamp01(0.45 + 0.45 * side * (lf[0] < 0.5 ? 1 : -1) + 0.2 * (fbm(x * 0.02, y * 0.02, 60, 3) - 0.5)));
            double vein = smoothstep(0.82, 1.0, Math.sin((a - Math.abs(bb) * 0.9) / (0.04 * L) * Math.PI)) * 0.22 * clamp01(1 - Math.abs(side));
            base = base.lerp(Color.hex("#6FA03A"), vein);
            base = base.lerp(Color.hex("#8DB84A"), Math.exp(-sq(bb / (0.012 * L + 1))) * 0.55);
            double rimIn = Math.exp(d / 4.0);
            base = base.add(WARM.scale(rimIn * 0.45 * (0.2 + 1.6 * glow)));
            base = base.scale(0.42 + 0.4 * clamp01(t + 0.2));
            c = c.lerp(base, cov);
        }
        // dark fern mass along the bottom
        double v = y / H;
        double fm = smoothstep(0.90, 1.0, v + (fbm(x * 0.012, y * 0.014, 40, 4) - 0.5) * 0.28);
        c = c.lerp(Color.hex("#030E06").lerp(Color.hex("#10401A"), fbm(x * 0.05, y * 0.05, 41, 3)), fm);
        return c;
    }

    @Override public Color pixel(double x, double y, double t) {
        double rs = Math.hypot(x - sx, y - sy), glow = Math.exp(-rs / (0.55 * H));
        Color c = bg(x, y);
        for (int i = 0; i < 3; i++) c = trunkLayer(c, x, y, i);
        c = shafts(c, x, y);
        for (int i = 3; i < 5; i++) c = trunkLayer(c, x, y, i);
        c = canopy(c, x, y);
        c = branchColor(c, x, y);
        c = understory(c, x, y);
        c = toucanColor(c, x, y);
        c = shafts(c.scale(1), x, y).lerp(c, 0.55);
        c = foreground(c, x, y);
        // bloom, sun disc over everything, vignette, grain
        c = c.add(SUNW.scale(0.65 * Math.exp(-rs / (0.06 * H))));
        c = c.lerp(Color.WHITE, 0.95 * coverage(circle(x, y, sx, sy, 0.016 * H)));
        c = c.add(WARM.scale(0.3 * glow * glow));
        double vg = 1 - 0.5 * sq(Math.hypot((x - W / 2) / (W / 2), (y - H / 2) / (H / 2)) / 1.35);
        c = c.scale(vg * 0.92);
        return c.add(new Color(1, 1, 1).scale(14 * grain(x, y, 0)));
    }
}
