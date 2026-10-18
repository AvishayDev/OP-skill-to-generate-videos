package imagewriter;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.IntStream;

/**
 * Renders a Painting: every pixel's color comes from painting.pixel(x, y, t), written with
 * ImageWriter.writePixel - nothing else ever touches the image (no camera, scene, geometry or drawing calls).
 * <pre>
 * java -cp BUILD imagewriter.Studio PaintingClass OUT [options]
 *   OUT = still.png | still.jpg   one image at --at seconds
 *         name-grid.jpg          contact sheet: 6 frames spread over the film (look before the long render)
 *         film.mp4               every frame (frames kept in film.mp4.frames/ until the encode succeeds;
 *                                a rerun continues where it stopped) then ffmpeg (H.264, yuv420p, silent)
 *         a directory            the PNG frame sequence only (00000.png, 00001.png, ...)
 *   --size 1080x1920   --seconds 6   --fps 30   --at 0   --aa 2 (2x2 samples per pixel)
 *   --set key=value (repeatable, read with option())   --stamp S (a change clears old frames)   --keep-frames
 * </pre>
 */
public final class Studio {
    private Studio() {
    }

    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("usage: Studio PaintingClass OUT [--size WxH] [--seconds S] [--fps F] [--at T] [--aa N] [--set k=v] [--stamp S] [--keep-frames]");
            System.exit(2);
        }
        Map<String, String> opts = new HashMap<>(), sets = new HashMap<>();
        boolean keepFrames = false;
        for (int i = 2; i < args.length; ++i) {
            if (args[i].equals("--keep-frames")) keepFrames = true;
            else if (args[i].equals("--set")) {
                String[] kv = args[++i].split("=", 2);
                sets.put(kv[0], kv.length > 1 ? kv[1] : "");
            } else opts.put(args[i].replaceFirst("^--", ""), args[++i]);
        }
        String[] size = opts.getOrDefault("size", "1080x1920").split("x");
        Painting painting = (Painting) Class.forName(args[0]).getDeclaredConstructor().newInstance();
        painting.width = Integer.parseInt(size[0]);
        painting.height = Integer.parseInt(size[1]);
        painting.seconds = Double.parseDouble(opts.getOrDefault("seconds", "0"));
        painting.fps = Double.parseDouble(opts.getOrDefault("fps", "30"));
        painting.options = sets;
        painting.setup();
        int aa = Integer.parseInt(opts.getOrDefault("aa", "1"));

        File out = new File(args[1]);
        String name = out.getName().toLowerCase();
        long start = System.currentTimeMillis();
        if (name.endsWith("-grid.jpg")) grid(painting, aa, out);
        else if (name.endsWith(".png") || name.endsWith(".jpg")) {
            double t = Double.parseDouble(opts.getOrDefault("at", "0"));
            painting.frame = (int) Math.round(t * painting.fps);
            render(painting, aa, t).writeToFile(out);
        } else if (name.endsWith(".mp4")) {
            File frames = new File(out.getPath() + ".frames");
            film(painting, aa, frames, opts.get("stamp"));
            encode(frames, painting.fps, out);
            if (!keepFrames) deleteDir(frames);
        } else film(painting, aa, out, opts.get("stamp"));
        System.out.printf("%s done in %.1f s%n", out, (System.currentTimeMillis() - start) / 1000.0);
    }

    /**
     * One frame: every pixel from the painting (rows in parallel)
     */
    static ImageWriter render(Painting painting, int aa, double t) {
        ImageWriter writer = new ImageWriter(painting.width, painting.height);
        IntStream.range(0, painting.height).parallel().forEach(y -> {
            for (int x = 0; x < painting.width; ++x) {
                if (aa <= 1) {
                    writer.writePixel(x, y, painting.pixel(x + 0.5, y + 0.5, t));
                    continue;
                }
                Color sum = Color.BLACK;
                for (int sy = 0; sy < aa; ++sy)
                    for (int sx = 0; sx < aa; ++sx)
                        sum = sum.add(painting.pixel(x + (sx + 0.5) / aa, y + (sy + 0.5) / aa, t));
                writer.writePixel(x, y, sum.scale(1.0 / (aa * aa)));
            }
        });
        return writer;
    }

    private static int frameCount(Painting painting) {
        return Math.max(1, (int) Math.round(painting.seconds * painting.fps));
    }

    /**
     * Every frame as a PNG in a directory; frames already there are kept (resumable) unless the stamp changed
     */
    private static void film(Painting painting, int aa, File dir, String stamp) throws IOException {
        dir.mkdirs();
        File stampFile = new File(dir, "stamp.txt");
        if (stamp != null) {
            String old = stampFile.exists() ? Files.readString(stampFile.toPath()) : "";
            if (!old.equals(stamp)) {
                deleteDir(dir);
                dir.mkdirs();
                Files.writeString(stampFile.toPath(), stamp);
            }
        }
        int frames = frameCount(painting), done = 0, step = Math.max(1, frames / 10);
        for (int f = 0; f < frames; ++f) {
            File file = new File(dir, String.format("%05d.png", f));
            if (!file.exists()) {
                painting.frame = f;
                File tmp = new File(dir, String.format("%05d.tmp.png", f));
                render(painting, aa, f / painting.fps).writeToFile(tmp);
                Files.move(tmp.toPath(), file.toPath());
            }
            if (++done % step == 0 || done == frames) System.out.printf("frames %d/%d%n", done, frames);
        }
    }

    /**
     * Six frames spread over the film on one sheet, each stamped with its time - written pixel by pixel too
     */
    private static void grid(Painting painting, int aa, File out) throws IOException {
        int cols = 3, rows = 2, n = cols * rows, gap = 8;
        double scale = 360.0 / Math.max(painting.width, painting.height);
        int w = (int) (painting.width * scale), h = (int) (painting.height * scale);
        ImageWriter sheet = new ImageWriter(cols * w + (cols + 1) * gap, rows * h + (rows + 1) * gap);
        Color ground = new Color(40, 40, 40), yellow = new Color(255, 255, 0);
        for (int y = 0; y < sheet.getNy(); ++y)
            for (int x = 0; x < sheet.getNx(); ++x)
                sheet.writePixel(x, y, ground);
        java.awt.Font font = Lettering.font(null);
        int frames = frameCount(painting);
        for (int i = 0; i < n; ++i) {
            int f = n == 1 || frames == 1 ? 0 : (int) Math.round(i * (frames - 1) / (double) (n - 1));
            painting.frame = f;
            double t = f / painting.fps;
            ImageWriter img = render(painting, aa, t);
            int left = gap + (i % cols) * (w + gap), top = gap + (i / cols) * (h + gap);
            String stamp = String.format("%.2fs", t);
            Lettering label = new Lettering(stamp, font, 9.5 * stamp.length(), left + 6 + 4.75 * stamp.length(), top + 14, 2);
            for (int y = 0; y < h; ++y)
                for (int x = 0; x < w; ++x) {
                    // the average of the frame pixels under this sheet pixel
                    int sx0 = (int) (x / scale), sx1 = Math.max(sx0 + 1, Math.min(painting.width, (int) ((x + 1) / scale)));
                    int sy0 = (int) (y / scale), sy1 = Math.max(sy0 + 1, Math.min(painting.height, (int) ((y + 1) / scale)));
                    Color sum = Color.BLACK;
                    for (int sy = sy0; sy < sy1; ++sy)
                        for (int sx = sx0; sx < sx1; ++sx)
                            sum = sum.add(img.readPixel(sx, sy));
                    Color c = sum.scale(1.0 / ((sx1 - sx0) * (sy1 - sy0)));
                    double px = left + x + 0.5, py = top + y + 0.5;
                    double d = label.distance(px, py);
                    c = c.lerp(Color.BLACK, Paint.coverage(label.distance(px - 1, py - 1)))
                            .lerp(yellow, Paint.coverage(d));
                    sheet.writePixel(left + x, top + y, c);
                }
        }
        sheet.writeToFile(out);
    }

    private static void encode(File frames, double fps, File out) throws IOException, InterruptedException {
        Process p = new ProcessBuilder("ffmpeg", "-y", "-loglevel", "error", "-framerate", String.valueOf(fps),
                "-i", new File(frames, "%05d.png").getPath(), "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart", out.getPath()).inheritIO().start();
        if (p.waitFor() != 0) throw new IOException("ffmpeg failed; frames kept in " + frames);
    }

    private static void deleteDir(File dir) {
        File[] files = dir.listFiles();
        if (files != null)
            for (File f : files) {
                if (f.isDirectory()) deleteDir(f);
                f.delete();
            }
        dir.delete();
    }
}
