import imagewriter.*;
import static imagewriter.Paint.*;

/** Baby dancing with a tiger: a 3D look decided per pixel (distance fields, soft shadows, occlusion, fur, skin glow). */
public class TigerDance3D extends Painting {
    static final double TS = 0.72;                       // tiger scale
    static double[] L(String h) {
        int v = Integer.parseInt(h.substring(1), 16);
        return new double[]{Math.pow((v >> 16 & 255) / 255d, 2.2), Math.pow((v >> 8 & 255) / 255d, 2.2), Math.pow((v & 255) / 255d, 2.2)};
    }
    static final double[] FUR = L("#F28A1C"), CREAM = L("#FFEBCB"), DARK = L("#1E0E06"), PINKC = L("#F58A9C"), WHITEC = L("#F4F4F2"),
            IRIS = L("#7A4318"), BLACKC = L("#050302"), SKIN = L("#F2B896"), HAIRC = L("#5A3519"), NAVY = L("#22305A"),
            JEAN = L("#3668A8"), MOUTH = L("#5A1220"), TONGUE = L("#F0707F"), SOLE = L("#9EA3B0"), WALL = L("#6FAEDC"),
            SOFA = L("#3A74B8"), KEYC = {3.1, 2.55, 1.9}, FILLC = {0.25, 0.4, 0.75};

    // ---- camera
    double[] cp = {0, 1.6, 5.9}, cf, cr, cu;
    double tanHalf = 0.365;
    double[] key;

    @Override protected void setup() {
        double[] tg = {0, 1.0, 0};
        cf = norm(new double[]{tg[0] - cp[0], tg[1] - cp[1], tg[2] - cp[2]});
        cr = norm(new double[]{-cf[2], 0, cf[0]});
        cu = new double[]{cr[1] * cf[2] - cr[2] * cf[1], cr[2] * cf[0] - cr[0] * cf[2], cr[0] * cf[1] - cr[1] * cf[0]};
        // make cu point up
        if (cu[1] < 0) { cu[0] = -cu[0]; cu[1] = -cu[1]; cu[2] = -cu[2]; }
        key = norm(new double[]{-0.55, 0.9, 0.55});
    }

    static double[] norm(double[] v) {
        double l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return new double[]{v[0] / l, v[1] / l, v[2] / l};
    }

    // ---- pose for a time t (cached per frame)
    static final class Pose {
        final double t;
        double tx, ty, tz, tc, ts, trc, trs;     // tiger origin, yaw, roll
        double bx, by, bz, bc, bs, brc, brs;     // baby
        double tailS, mouth, wL, wR, lean;
        double bwL, bwR;
        Pose(double t) {
            this.t = t;
            double w = 2 * Math.PI * t;
            double bobT = Math.abs(Math.sin(w + 0.6)), bobB = Math.abs(Math.sin(w));
            tx = 0.5; tz = -0.4; ty = 0.06 * bobT;
            double ya = 0.32 + 0.08 * Math.sin(w / 2), ra = 0.07 * Math.sin(w + 0.6 + Math.PI / 2);
            tc = Math.cos(ya); ts = Math.sin(ya); trc = Math.cos(ra); trs = Math.sin(ra);
            bx = -0.5; bz = 0.85; by = 0.09 * bobB;
            double yb = -0.28 + 0.1 * Math.sin(w / 2 + 1), rb = 0.09 * Math.sin(w + Math.PI / 2);
            bc = Math.cos(yb); bs = Math.sin(yb); brc = Math.cos(rb); brs = Math.sin(rb);
            tailS = Math.sin(w + 1.2); mouth = 0.5 + 0.5 * Math.sin(w * 2 + 0.4);
            wL = Math.sin(w + 0.3); wR = Math.sin(w + 2.2);
            bwL = Math.sin(w + 0.9); bwR = Math.sin(w + 3.8);
        }
    }
    volatile Pose cache;
    Pose pose(double t) {
        Pose p = cache;
        if (p == null || p.t != t) { p = new Pose(t); cache = p; }
        return p;
    }

    // ---- distance helpers
    static double ell(double x, double y, double z, double cx, double cy, double cz, double a, double b, double c) {
        double k = Math.sqrt(sq((x - cx) / a) + sq((y - cy) / b) + sq((z - cz) / c)) - 1;
        return k * Math.min(a, Math.min(b, c));
    }
    static double cap(double x, double y, double z, double ax, double ay, double az, double bx, double by, double bz, double r) {
        double px = x - ax, py = y - ay, pz = z - az, dx = bx - ax, dy = by - ay, dz = bz - az;
        double h = clamp01((px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz));
        return Math.sqrt(sq(px - dx * h) + sq(py - dy * h) + sq(pz - dz * h)) - r;
    }
    static double box(double x, double y, double z, double cx, double cy, double cz, double hx, double hy, double hz, double r) {
        double qx = Math.abs(x - cx) - hx + r, qy = Math.abs(y - cy) - hy + r, qz = Math.abs(z - cz) - hz + r;
        return Math.sqrt(sq(Math.max(qx, 0)) + sq(Math.max(qy, 0)) + sq(Math.max(qz, 0))) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
    }
    static double smin(double a, double b, double k) {
        double h = clamp01(0.5 + 0.5 * (b - a) / k);
        return mix(b, a, h) - k * h * (1 - h);
    }
    static void hit(double[] m, double d, int id) {
        if (d < m[1]) { m[1] = d; m[0] = id; }
    }

    // ---- the world
    double map(double x, double y, double z, double[] m, Pose P) {
        m[1] = 1e9;
        hit(m, y, 0);
        hit(m, z + 2.0, 1);
        double sf = box(x, y, z, 0, 0.72, -1.45, 1.75, 0.52, 0.28, 0.12);
        sf = Math.min(sf, box(x, y, z, 0, 0.3, -1.05, 1.75, 0.22, 0.48, 0.12));
        sf = Math.min(sf, box(x, y, z, -1.65, 0.5, -1.1, 0.25, 0.4, 0.55, 0.12));
        sf = Math.min(sf, box(x, y, z, 1.65, 0.5, -1.1, 0.25, 0.4, 0.55, 0.12));
        hit(m, sf, 2);
        tiger(x, y, z, m, P);
        baby(x, y, z, m, P);
        return m[1];
    }

    void tiger(double x, double y, double z, double[] m, Pose P) {
        double qx = x - P.tx, qy = y - P.ty, qz = z - P.tz;
        double lx = P.tc * qx + P.ts * qz, lz = -P.ts * qx + P.tc * qz;
        double rx = P.trc * lx + P.trs * qy, ry = -P.trs * lx + P.trc * qy;
        double a = rx / TS, b = ry / TS, c = lz / TS;
        double bd = (Math.sqrt(sq(a - 0.15) + sq(b - 1.1) + sq(c)) - 1.7) * TS;
        if (bd > 0.3) { hit(m, bd, 3); return; }
        double bob = P.tailS;
        double body = ell(a, b, c, 0, 0.95, 0, 0.5, 0.55, 0.42);
        double head = ell(a, b, c, 0, 1.72, 0.05, 0.54, 0.46, 0.46);
        double o = smin(body, head, 0.12);
        o = smin(o, ell(a, b, c, -0.38, 2.1, -0.02, 0.17, 0.17, 0.08), 0.05);
        o = smin(o, ell(a, b, c, 0.38, 2.1, -0.02, 0.17, 0.17, 0.08), 0.05);
        o = smin(o, cap(a, b, c, -0.2, 0.6, 0, -0.2, 0.14, 0.05, 0.15), 0.1);
        o = smin(o, cap(a, b, c, 0.2, 0.6, 0, 0.2, 0.14, 0.05, 0.15), 0.1);
        // arms
        double lhx = -0.92 + 0.08 * P.wL, lhy = 1.0 + 0.2 * P.wL, lhz = 0.4;
        double rhx = 0.88, rhy = 1.75 + 0.25 * P.wR, rhz = 0.2;
        o = smin(o, cap(a, b, c, -0.42, 1.25, 0.05, -0.72, 1.0, 0.25, 0.13), 0.08);
        o = smin(o, cap(a, b, c, -0.72, 1.0, 0.25, lhx, lhy, lhz, 0.12), 0.06);
        o = smin(o, cap(a, b, c, 0.42, 1.25, 0.05, 0.78, 1.45, 0.15, 0.13), 0.08);
        o = smin(o, cap(a, b, c, 0.78, 1.45, 0.15, rhx, rhy, rhz, 0.12), 0.06);
        // tail
        double t1y = 0.7 + 0.1 * bob, t2y = 1.1 + 0.2 * bob, t3y = 1.55 + 0.25 * bob;
        o = smin(o, cap(a, b, c, 0.3, 0.65, -0.35, 0.75, t1y, -0.5, 0.09), 0.05);
        o = smin(o, cap(a, b, c, 0.75, t1y, -0.5, 1.0, t2y, -0.45, 0.09), 0.05);
        o = smin(o, cap(a, b, c, 1.0, t2y, -0.45, 0.95, t3y, -0.4, 0.09), 0.05);
        hit(m, o * TS, 3);
        hit(m, ell(a, b, c, 0.95, t3y + 0.04, -0.4, 0.11, 0.11, 0.11) * TS, 5);
        // cream parts
        hit(m, ell(a, b, c, 0, 0.92, 0.14, 0.36, 0.45, 0.34) * TS, 4);
        hit(m, ell(a, b, c, 0, 1.6, 0.38, 0.25, 0.18, 0.2) * TS, 4);
        hit(m, ell(a, b, c, -0.2, 1.58, 0.34, 0.17, 0.13, 0.15) * TS, 4);
        hit(m, ell(a, b, c, 0.2, 1.58, 0.34, 0.17, 0.13, 0.15) * TS, 4);
        hit(m, ell(a, b, c, lhx, lhy, lhz, 0.15, 0.15, 0.15) * TS, 4);
        hit(m, ell(a, b, c, rhx, rhy, rhz, 0.15, 0.15, 0.15) * TS, 4);
        hit(m, ell(a, b, c, -0.2, 0.08, 0.12, 0.19, 0.1, 0.28) * TS, 4);
        hit(m, ell(a, b, c, 0.2, 0.08, 0.12, 0.19, 0.1, 0.28) * TS, 4);
        // face
        hit(m, ell(a, b, c, -0.38, 2.1, 0.05, 0.1, 0.1, 0.04) * TS, 15);
        hit(m, ell(a, b, c, 0.38, 2.1, 0.05, 0.1, 0.1, 0.04) * TS, 15);
        hit(m, ell(a, b, c, 0, 1.67, 0.57, 0.085, 0.06, 0.05) * TS, 15);
        for (int s = -1; s <= 1; s += 2) {
            double ex = 0.2 * s;
            hit(m, ell(a, b, c, ex, 1.82, 0.4, 0.125, 0.15, 0.09) * TS, 6);
            hit(m, ell(a, b, c, ex - 0.025 * s, 1.81, 0.47, 0.08, 0.1, 0.05) * TS, 7);
            hit(m, ell(a, b, c, ex - 0.025 * s, 1.81, 0.51, 0.045, 0.058, 0.03) * TS, 8);
        }
        double mo = 0.05 + 0.04 * P.mouth;
        hit(m, ell(a, b, c, 0, 1.5, 0.5, 0.14, mo, 0.1) * TS, 14);
        hit(m, ell(a, b, c, 0, 1.5 - mo * 0.55, 0.52, 0.08, mo * 0.5, 0.07) * TS, 17);
    }

    void baby(double x, double y, double z, double[] m, Pose P) {
        double qx = x - P.bx, qy = y - P.by, qz = z - P.bz;
        double lx = P.bc * qx + P.bs * qz, lz = -P.bs * qx + P.bc * qz;
        double a = P.brc * lx + P.brs * qy, b = -P.brs * lx + P.brc * qy, c = lz;
        double bd = Math.sqrt(sq(a) + sq(b - 0.6) + sq(c)) - 0.95;
        if (bd > 0.3) { hit(m, bd, 9); return; }
        double hx = 0.4 + 0.1 * P.bwR, hy = 0.9 + 0.2 * P.bwR, hz = 0.2;
        double jx = -0.38 + 0.06 * P.bwL, jy = 0.55 + 0.22 * P.bwL, jz = 0.12;
        // skin
        double sk = ell(a, b, c, 0, 0.94, 0, 0.26, 0.25, 0.24);
        sk = smin(sk, ell(a, b, c, -0.26, 0.93, 0, 0.04, 0.06, 0.03), 0.03);
        sk = smin(sk, ell(a, b, c, 0.26, 0.93, 0, 0.04, 0.06, 0.03), 0.03);
        sk = smin(sk, ell(a, b, c, 0, 0.85, 0.235, 0.028, 0.022, 0.02), 0.02);
        sk = smin(sk, ell(a, b, c, hx, hy, hz, 0.05, 0.05, 0.05), 0.02);
        sk = smin(sk, ell(a, b, c, jx, jy, jz, 0.05, 0.05, 0.05), 0.02);
        sk = smin(sk, cap(a, b, c, 0, 0.74, 0, 0, 0.8, 0, 0.07), 0.04);
        hit(m, sk, 9);
        // hair: cap of a larger ellipsoid above a slanted hairline
        double hairD = Math.max(ell(a, b, c, 0, 0.97, -0.01, 0.275, 0.26, 0.255), -(b - (1.1 + 0.7 * Math.min(c, 0))));
        hairD = Math.min(hairD, ell(a, b, c, 0.03, 1.2, 0.08, 0.05, 0.055, 0.05));
        hit(m, hairD, 10);
        // eyes
        for (int s = -1; s <= 1; s += 2) {
            double ex = 0.088 * s;
            hit(m, ell(a, b, c, ex, 0.90, 0.205, 0.056, 0.066, 0.04), 6);
            hit(m, ell(a, b, c, ex + 0.004 * s, 0.895, 0.225, 0.042, 0.052, 0.028), 7);
            hit(m, ell(a, b, c, ex + 0.004 * s, 0.895, 0.238, 0.023, 0.03, 0.016), 8);
        }
        hit(m, ell(a, b, c, 0, 0.785, 0.205, 0.075, 0.025 + 0.02 * P.mouth, 0.035), 14);
        // clothes
        double sh = ell(a, b, c, 0, 0.58, 0, 0.19, 0.22, 0.15);
        sh = smin(sh, cap(a, b, c, -0.17, 0.68, 0, jx, jy, jz, 0.056), 0.04);
        sh = smin(sh, cap(a, b, c, 0.17, 0.68, 0, hx, hy, hz, 0.056), 0.04);
        hit(m, sh, 11);
        double jn = ell(a, b, c, 0, 0.4, 0, 0.185, 0.14, 0.145);
        jn = smin(jn, cap(a, b, c, -0.09, 0.4, 0, -0.09, 0.12, 0.03, 0.075), 0.05);
        jn = smin(jn, cap(a, b, c, 0.09, 0.4, 0, 0.09, 0.12, 0.03, 0.075), 0.05);
        hit(m, jn, 12);
        hit(m, ell(a, b, c, -0.09, 0.05, 0.06, 0.075, 0.05, 0.12), 13);
        hit(m, ell(a, b, c, 0.09, 0.05, 0.06, 0.075, 0.05, 0.12), 13);
        hit(m, ell(a, b, c, -0.09, 0.012, 0.06, 0.077, 0.016, 0.125), 16);
        hit(m, ell(a, b, c, 0.09, 0.012, 0.06, 0.077, 0.016, 0.125), 16);
    }

    // local tiger coordinates for fur patterns
    static double[] tigerLocal(double x, double y, double z, Pose P) {
        double qx = x - P.tx, qy = y - P.ty, qz = z - P.tz;
        double lx = P.tc * qx + P.ts * qz, lz = -P.ts * qx + P.tc * qz;
        double rx = P.trc * lx + P.trs * qy, ry = -P.trs * lx + P.trc * qy;
        return new double[]{rx / TS, ry / TS, lz / TS};
    }
    static double[] babyLocal(double x, double y, double z, Pose P) {
        double qx = x - P.bx, qy = y - P.by, qz = z - P.bz;
        double lx = P.bc * qx + P.bs * qz, lz = -P.bs * qx + P.bc * qz;
        return new double[]{P.brc * lx + P.brs * qy, -P.brs * lx + P.brc * qy, lz};
    }

    // ---- shading
    // mat: r g b, specular power, specular strength, glow (subsurface), fuzz
    void material(int id, double x, double y, double z, double[] n, Pose P, double[] mat) {
        double[] col = WALL;
        double sp = 20, ss = 0.04, sss = 0, fz = 0;
        switch (id) {
            case 0: { // floor: wooden boards
                double u = x / 0.28, bi = Math.floor(u), fu = u - bi;
                double grain = fbm(x * 3 + 7 * hash((int) bi, 0, 3), z * 40, 1.7, 3);
                double tone = 0.75 + 0.35 * hash((int) bi, 1, 2) + 0.2 * grain;
                double edge = smoothstep(0.0, 0.03, fu) * smoothstep(1.0, 0.97, fu);
                double bj = Math.floor(z / 1.1 + hash((int) bi, 5, 5) * 3);
                col = new double[]{0.62 * tone * (0.4 + 0.6 * edge), 0.43 * tone * (0.4 + 0.6 * edge), 0.26 * tone * (0.4 + 0.6 * edge)};
                col = new double[]{Math.pow(col[0], 1.0), Math.pow(col[1], 1.0), Math.pow(col[2], 1.0)};
                sp = 60; ss = 0.22; break;
            }
            case 1: { // wall with soft paper texture and little tiger faces
                double wn = fbm(x * 10, y * 10, 3.3, 2);
                col = new double[]{WALL[0] * (0.9 + 0.2 * wn), WALL[1] * (0.9 + 0.2 * wn), WALL[2] * (0.9 + 0.2 * wn)};
                double[][] dc = {{-1.25, 2.9}, {-0.5, 3.2}, {0.4, 2.85}, {1.2, 3.15}, {-1.35, 1.9}, {1.3, 2.1}, {-0.55, 2.45}, {0.85, 2.5}};
                for (double[] d : dc) {
                    double yy = d[1] + 0.03 * Math.sin(2 * Math.PI * P.t + d[0] * 3);
                    double r = Math.hypot(x - d[0], y - yy);
                    double face = coverage((r - 0.16) * 400);
                    double ear = Math.max(coverage((Math.hypot(x - d[0] - 0.12, y - yy - 0.12) - 0.06) * 400), coverage((Math.hypot(x - d[0] + 0.12, y - yy - 0.12) - 0.06) * 400));
                    double mz = coverage((Math.hypot((x - d[0]) / 0.09, (y - yy + 0.05) / 0.065) - 1) * 60);
                    double eye = Math.max(coverage((Math.hypot(x - d[0] - 0.06, y - yy - 0.03) - 0.016) * 400), coverage((Math.hypot(x - d[0] + 0.06, y - yy - 0.03) - 0.016) * 400));
                    double fm = Math.max(face, ear);
                    for (int k = 0; k < 3; k++) col[k] = mix(col[k], FUR[k], fm);
                    for (int k = 0; k < 3; k++) col[k] = mix(col[k], CREAM[k], mz * face);
                    for (int k = 0; k < 3; k++) col[k] = mix(col[k], DARK[k], eye * face);
                }
                ss = 0.02; break;
            }
            case 2: {
                double wv = fbm(x * 40, y * 40, z * 40, 2);
                col = new double[]{SOFA[0] * (0.85 + 0.3 * wv), SOFA[1] * (0.85 + 0.3 * wv), SOFA[2] * (0.85 + 0.3 * wv)};
                ss = 0.05; fz = 0.5; break;
            }
            case 3: { // tiger fur with stripes
                double[] l = tigerLocal(x, y, z, P);
                double a = l[0], b = l[1], c = l[2];
                double w = fbm(a * 4, b * 4, c * 4, 2) - 0.5;
                double st = 0;
                double side = smoothstep(0.18, 0.42, Math.abs(a)) ;
                if (b < 1.4) {
                    st = side * smoothstep(0.62, 0.8, Math.sin(b * 21 + 5 * w));
                    if (a > 0.55 && c < -0.2) st = smoothstep(0.55, 0.75, Math.sin((a + b) * 20));
                } else {
                    double fore = smoothstep(1.92, 2.0, b) * smoothstep(0.3, 0.1, Math.abs(a) - 0.0) * 1.0;
                    double v1 = smoothstep(0.62, 0.82, Math.sin(a * 36 + 4 * w));
                    double ch = smoothstep(0.32, 0.46, Math.abs(a)) * smoothstep(0.6, 0.8, Math.sin(b * 34 + 4 * w));
                    st = Math.max(Math.min(fore, v1) * (c > 0 ? 1 : 0.6), ch * (c > -0.1 ? 1 : 0));
                }
                double v = 0.9 + 0.2 * fbm(x * 30, y * 30, z * 30, 2);
                col = new double[]{mix(FUR[0], DARK[0], st) * v, mix(FUR[1], DARK[1], st) * v, mix(FUR[2], DARK[2], st) * v};
                sp = 12; ss = 0.07; fz = 1; break;
            }
            case 4: col = CREAM; sp = 10; ss = 0.05; fz = 1; break;
            case 5: col = DARK; sp = 10; ss = 0.05; fz = 1; break;
            case 6: col = WHITEC; sp = 120; ss = 1.1; break;
            case 7: { // iris: ring gradient
                double[] l = id == 7 ? (n == null ? null : null) : null;
                col = IRIS; sp = 200; ss = 1.2; break;
            }
            case 8: col = BLACKC; sp = 250; ss = 1.5; break;
            case 9: { // skin with cheeks
                double[] l = babyLocal(x, y, z, P);
                double ch = Math.max(Math.exp(-(sq(l[0] - 0.13) + sq(l[1] - 0.83) + sq(l[2] - 0.2)) / 0.0026), Math.exp(-(sq(l[0] + 0.13) + sq(l[1] - 0.83) + sq(l[2] - 0.2)) / 0.0026));
                col = new double[]{SKIN[0] + 0.18 * ch, SKIN[1] - 0.04 * ch, SKIN[2] - 0.04 * ch};
                sp = 30; ss = 0.25; sss = 1; break;
            }
            case 10: { col = HAIRC; double hn = fbm(x * 90, y * 90, z * 90, 2); col = new double[]{HAIRC[0] * (0.7 + 0.6 * hn), HAIRC[1] * (0.7 + 0.6 * hn), HAIRC[2] * (0.7 + 0.6 * hn)}; sp = 40; ss = 0.3; fz = 0.6; break; }
            case 11: {
                double[] l = babyLocal(x, y, z, P);
                double s = smoothstep(-0.12, 0.12, Math.sin(l[1] * 55));
                double kn = 0.92 + 0.16 * fbm(x * 120, y * 120, z * 120, 1);
                col = new double[]{mix(WHITEC[0] * 0.9, NAVY[0], s) * kn, mix(WHITEC[1] * 0.9, NAVY[1], s) * kn, mix(WHITEC[2] * 0.9, NAVY[2], s) * kn};
                ss = 0.05; fz = 0.8; break;
            }
            case 12: {
                double wv = 0.85 + 0.3 * fbm(x * 150, y * 150, z * 150, 1);
                col = new double[]{JEAN[0] * wv, JEAN[1] * wv, JEAN[2] * wv}; ss = 0.06; fz = 0.4; break;
            }
            case 13: col = WHITEC; sp = 50; ss = 0.4; break;
            case 14: col = MOUTH; sp = 60; ss = 0.5; break;
            case 15: col = PINKC; sp = 60; ss = 0.5; break;
            case 16: col = SOLE; sp = 30; ss = 0.2; break;
            case 17: col = TONGUE; sp = 60; ss = 0.5; break;
            default: break;
        }
        mat[0] = col[0]; mat[1] = col[1]; mat[2] = col[2]; mat[3] = sp; mat[4] = ss; mat[5] = sss; mat[6] = fz;
    }

    @Override public Color pixel(double px, double py, double t) {
        Pose P = pose(t);
        double aspect = width / (double) height;
        double u = (px / width * 2 - 1) * aspect * tanHalf, v = (1 - py / height * 2) * tanHalf;
        double[] rd = norm(new double[]{cf[0] + cr[0] * u + cu[0] * v, cf[1] + cr[1] * u + cu[1] * v, cf[2] + cr[2] * u + cu[2] * v});
        double[] m = new double[2];
        double d = 0, hx = 0, hy = 0, hz = 0;
        boolean hitSomething = false;
        for (int i = 0; i < 110; i++) {
            hx = cp[0] + rd[0] * d; hy = cp[1] + rd[1] * d; hz = cp[2] + rd[2] * d;
            double s = map(hx, hy, hz, m, P);
            if (s < 0.0008 * d + 0.0004) { hitSomething = true; break; }
            d += s * 0.9;
            if (d > 14) break;
        }
        double r, g, b;
        if (!hitSomething) {
            r = g = b = 0.1;
        } else {
            int id = (int) m[0];
            double e = 0.0012;
            double[] n = {map(hx + e, hy, hz, m, P) - map(hx - e, hy, hz, m, P), map(hx, hy + e, hz, m, P) - map(hx, hy - e, hz, m, P), map(hx, hy, hz + e, m, P) - map(hx, hy, hz - e, m, P)};
            n = norm(n);
            double[] mat = new double[7];
            material(id, hx, hy, hz, n, P, mat);
            // fur / fabric micro bump
            if (mat[6] > 0) {
                double f = 60 * (id == 3 || id == 4 || id == 5 ? 1 : 0.7), amt = 0.22 * mat[6];
                n = norm(new double[]{n[0] + amt * (noise(hx * f, hy * f, hz * f) - 0.5), n[1] + amt * (noise(hx * f + 9, hy * f, hz * f) - 0.5), n[2] + amt * (noise(hx * f, hy * f + 9, hz * f) - 0.5)});
            }
            // soft shadow toward the key light
            double sh = 1, td = 0.03;
            for (int i = 0; i < 28; i++) {
                double s = map(hx + n[0] * 0.004 + key[0] * td, hy + n[1] * 0.004 + key[1] * td, hz + n[2] * 0.004 + key[2] * td, m, P);
                sh = Math.min(sh, 7 * s / td);
                td += clamp(s, 0.02, 0.35);
                if (sh < 0.01 || td > 7) break;
            }
            sh = clamp01(sh); sh = sh * sh * (3 - 2 * sh);
            // ambient occlusion
            double ao = 0, w = 1;
            for (int i = 1; i <= 5; i++) {
                double h = 0.025 * i * i;
                ao += w * (h - map(hx + n[0] * h, hy + n[1] * h, hz + n[2] * h, m, P));
                w *= 0.6;
            }
            ao = clamp01(1 - 2.2 * ao);
            double nl = n[0] * key[0] + n[1] * key[1] + n[2] * key[2];
            double wrap = mat[5] > 0 ? 0.35 : 0.0;
            double diff = clamp01((nl + wrap) / (1 + wrap));
            double vx = -rd[0], vy = -rd[1], vz = -rd[2];
            double hxv = key[0] + vx, hyv = key[1] + vy, hzv = key[2] + vz;
            double hl = Math.sqrt(hxv * hxv + hyv * hyv + hzv * hzv);
            double nh = clamp01((n[0] * hxv + n[1] * hyv + n[2] * hzv) / hl);
            double spec = Math.pow(nh, mat[3]) * mat[4] * sh;
            double nv = clamp01(n[0] * vx + n[1] * vy + n[2] * vz);
            double rim = Math.pow(1 - nv, 3);
            double sky = n[1] * 0.5 + 0.5;
            double[] amb = {mix(0.30, 0.20, sky) * 0.0 + mix(0.32, 0.30, sky), mix(0.24, 0.40, sky), mix(0.16, 0.58, sky)};
            double fill = clamp01(n[0] * 0.6 + n[2] * 0.5 + 0.35);
            double[] out = new double[3];
            for (int k = 0; k < 3; k++) {
                double lit = KEYC[k] * diff * sh + amb[k] * ao * 0.85 + FILLC[k] * fill * ao * 0.6;
                double c0 = mat[k] * lit;
                if (mat[5] > 0) c0 += mat[k] * (k == 0 ? 0.35 : k == 1 ? 0.1 : 0.05) * (1 - diff * sh) * ao * 1.1;   // skin glow in shade
                c0 += spec * KEYC[k] * 0.6;
                c0 += rim * (mat[6] > 0.5 ? 0.35 : 0.1) * mat[k] * ao * (0.6 + 0.4 * sky) * (k == 2 ? 1.3 : 1.0);
                out[k] = c0;
            }
            // catchlights in the eyes
            if (id == 7 || id == 8 || id == 6) {
                double cl = Math.pow(nh, 400) * 3;
                double cx2 = Math.pow(clamp01((n[0] * 0.5 + n[1] * 0.6 + n[2] * 0.62)), 220) * 1.2;
                for (int k = 0; k < 3; k++) out[k] += (cl + cx2) * (id == 6 ? 0.2 : 1.0);
            }
            // contact shadow under characters
            r = out[0]; g = out[1]; b = out[2];
            if (id == 0) {
                double ct = Math.exp(-sq(hx - P.tx) / 0.55 - sq(hz - P.tz) / 0.25) * 0.18 + Math.exp(-sq(hx - P.bx) / 0.22 - sq(hz - P.bz) / 0.15) * 0.22;
                r *= 1 - ct; g *= 1 - ct; b *= 1 - ct;
            }
        }
        // tone map, gamma, vignette
        double vg = Math.hypot((px / width - 0.5) * 1.1, (py / height - 0.5) * 0.8);
        double vn = 1 - 0.38 * smoothstep(0.3, 0.75, vg);
        double[] o = {r, g, b};
        for (int k = 0; k < 3; k++) {
            double c = 1 - Math.exp(-o[k] * 1.25 * vn);
            c = Math.pow(c, 1 / 2.2);
            o[k] = clamp(c * 255 + (grain(px, py, frame) - 0.5) * 3, 0, 255);
        }
        return new Color(o[0], o[1], o[2]);
    }
}
