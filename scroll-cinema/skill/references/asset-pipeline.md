# Asset pipeline — Blender (headless)

Run Blender in background. On Windows the executable is typically
`C:\Program Files\Blender Foundation\Blender <ver>\blender.exe`.
Discover it if unknown: `Get-Command blender` or search Program Files.

Invoke: `blender --background <scene.blend> --python script.py`
(or `--background --python script.py` when the script itself loads assets).

> Adapt object/property names by **discovering them at runtime** — never hardcode
> names that may not exist. Print `[o.name for o in bpy.data.objects]` first.

---

## 1. Inspect a .blend (always do this first)

```python
import bpy
print("OBJECTS:", [(o.name, o.type) for o in bpy.data.objects])
print("MATERIALS:", [m.name for m in bpy.data.materials])
print("SCENES:", [s.name for s in bpy.data.scenes])
```

Use it to confirm the **hero object name**, and to see the camera/light rig
(names like `KeyLight`, `RimLight`, `FillLight`, `Camera`). Mirror that rig in
Three.js for a consistent look.

---

## 2. Export the hero object to GLB

Export **only the hero object** (`use_selection=True`) — not the studio floor,
lights, or camera.

```python
import bpy, os

HERO = "StudioBox"                      # <-- from step 1
OUT  = os.path.abspath("assets/Objects/hero.glb")

bpy.ops.object.select_all(action='DESELECT')
obj = bpy.data.objects[HERO]
obj.select_set(True)
bpy.context.view_layer.objects.active = obj

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    use_selection=True,          # only the selection
    export_apply=True,           # bake modifiers
    export_yup=True,             # glTF is Y-up
    export_materials='EXPORT',   # keep PBR maps
)
print("EXPORTED", OUT, os.path.getsize(OUT))
```

Notes:
- A "WARNING: More than one shader node tex image used for a texture" is benign.
- glTF is Y-up; the model arrives upright with `export_yup=True`. Still call
  `fitObject()` in Three.js so framing never depends on the source scale.
- Draco compression is optional; skip it for simplicity (no decoder needed).

---

## 3. Re-encode the film to all-intra 720p  ← THE CRITICAL STEP

A 4K long-GOP H.264 file **cannot be scrubbed**. Each `currentTime` seek must
rewind to the previous keyframe and decode forward — ~0.5–1.3 s at 4K — and the
element has **no frame to show during that window (black)**. The fix is an
all-intra encode: a keyframe on *every* frame, so any seek decodes exactly one
frame instantly.

Blender ships FFmpeg with x264, so no external ffmpeg is required.

```python
import bpy, os, glob

SRC = os.path.abspath("assets/media/source.mp4")
OUTBASE = os.path.abspath("assets/media/scrub-film")

sc = bpy.context.scene
sc.sequence_editor_clear()
sed = sc.sequence_editor_create()

# Discover the correct collection name across versions:
#   Blender 5.x  -> sed.strips
#   older        -> sed.sequences / sed.sequences_all
strips = getattr(sed, "strips", None) or getattr(sed, "sequences", None)
clip = bpy.data.movieclips.load(SRC)          # MovieClip object, NOT a path string
strip = strips.new_clip("film", clip, 1, 1)   # (name, clip, start_frame, channel)
bpy.context.view_layer.update()

dur = int(strip.frame_final_duration)
sc.frame_start, sc.frame_end = 1, dur

r = sc.render
r.resolution_x, r.resolution_y = 1280, 720    # 720p is plenty under a scrim
r.resolution_percentage = 100
r.fps, r.fps_base = 30, 1.0

# Dynamic enum: FFMPEG only appears after media_type == "VIDEO" (Blender 4.5+/5.x)
r.image_settings.media_type = "VIDEO"
r.image_settings.file_format = "FFMPEG"

f = r.ffmpeg
f.format = "MPEG4"                 # mp4 container
f.codec = "H264"
f.gopsize = 1                      # <-- keyframe EVERY frame (all-intra)
f.constant_rate_factor = "MEDIUM"  # quality/size balance; HIGH for more
f.ffmpeg_preset = "GOOD"
f.audio_codec = "NONE"             # muted background; drop the audio track

r.filepath = OUTBASE               # no extension: Blender appends range + .mp4
print("ENCODING 1..%d @ %dx%d" % (dur, r.resolution_x, r.resolution_y))
bpy.ops.render.render(animation=True)

# Blender writes e.g. scrub-film0001-0553.mp4 — rename to a clean name
produced = sorted(glob.glob(OUTBASE + "*.mp4"))
if produced and produced[-1] != OUTBASE + ".mp4":
    os.replace(produced[-1], OUTBASE + ".mp4")
print("ENCODED", OUTBASE + ".mp4", os.path.getsize(OUTBASE + ".mp4"))
```

Result: a file roughly the same duration, smaller than the 4K original, and
**instantly seekable**. Typical: a 30 MB 4K/18 s clip → ~12 MB 720p all-intra.

Tuning:
- Smaller: `resolution_x/y = 960, 540`, or `constant_rate_factor = "LOW"`.
- Higher quality: `constant_rate_factor = "HIGH"`.
- Keep `gopsize = 1` **always**. Without it, scrubbing breaks.

---

## 4. Poster / first frame

Render one representative frame to JPEG for first paint and reduced-motion.

```python
import bpy, os
sc = bpy.context.scene
# ... set up the same clip + strip as step 3 ...
sc.frame_set(int(dur * 0.55))                 # a mid-clip frame
r = sc.render
r.resolution_x, r.resolution_y = 1280, 720
r.image_settings.media_type = "IMAGE"         # switch back from VIDEO
r.image_settings.file_format = "JPEG"
r.image_settings.quality = 82
r.filepath = os.path.abspath("assets/media/scrub-poster")
bpy.ops.render.render(write_still=True)       # writes scrub-poster.jpg
```

Use this file as both `poster="…"` on the `<video>` and
`background-image` on `.film-bg`.

---

## 5. Sanity-check the footage is not black

Before blaming code, confirm the source has no black segments. Sample every
~8th frame at tiny resolution and print mean luminance.

```python
import bpy, os, numpy as np, shutil
# ... set up clip + strip ...
out = os.path.abspath("assets/media/_lum"); shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
sc.render.resolution_x, sc.render.resolution_y = 48, 27
sc.render.image_settings.media_type = "IMAGE"
sc.render.image_settings.file_format = "PNG"
for f in range(1, dur + 1, 8):
    sc.frame_set(f); sc.render.filepath = os.path.join(out, "f%04d" % f)
    bpy.ops.render.render(write_still=True)
for f in range(1, dur + 1, 8):
    img = bpy.data.images.load(os.path.join(out, "f%04d.png" % f))
    px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
    print("t=%.2fs lum=%.4f" % (f / 30.0, float(px[:, :3].mean())))
    bpy.data.images.remove(img)
shutil.rmtree(out, ignore_errors=True)
```

If luminance stays roughly constant and well above 0, the footage is fine and any
black background is a **pipeline** problem (§3 / canvas renderer), not content.
