"""Generate the original CC0 demo film for Scroll-Cinema.

Creates an abstract "neon forest" fly-through ENTIRELY from procedural Blender
primitives — no external assets, models, or footage. The rendered output is
owned by this project and shipped under the repository license, so the demo
video is safe to redistribute.

It also demonstrates the encoding rule the whole project depends on: the film
is exported ALL-INTRA (a keyframe on every frame), so scroll seeking is instant.

Usage:
  # quick single-frame preview
  blender --background --python scripts/demo-clip.py -- --test

  # full render -> assets/media/scrub-film.mp4 (+ scrub-poster.jpg)
  blender --background --python scripts/demo-clip.py -- --frames 240
"""
import bpy, math, random, os, sys, glob

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
TEST = "--test" in argv


def opt(name, default):
    return argv[argv.index(name) + 1] if name in argv else default


NFRAMES = int(opt("--frames", "240"))
ROOT = os.getcwd()
MEDIA = os.path.join(ROOT, "assets", "media")
os.makedirs(MEDIA, exist_ok=True)
random.seed(11)

# ---- clean slate ----------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ---- render engine (discover identifiers; don't hardcode) -----------------
engines = [i.identifier for i in sc.render.bl_rna.properties["engine"].enum_items]
for cand in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    if cand in engines:
        sc.render.engine = cand
        break
else:
    sc.render.engine = engines[0]
try:
    sc.eevee.taa_render_samples = 24
except Exception:
    pass

W, H, FPS = 1280, 720, 30
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.resolution_percentage = 100
sc.render.fps, sc.render.fps_base = FPS, 1.0
sc.frame_start, sc.frame_end = 1, NFRAMES

# ---- world ----------------------------------------------------------------
world = bpy.data.worlds.new("World")
sc.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.012, 0.030, 0.045, 1.0)
    bg.inputs[1].default_value = 1.0

# ---- ground ---------------------------------------------------------------
bpy.ops.mesh.primitive_plane_add(size=700, location=(0, 0, 0))
ground = bpy.context.active_object
gmat = bpy.data.materials.new("Ground")
gmat.use_nodes = True
gp = gmat.node_tree.nodes.get("Principled BSDF")
gp.inputs["Base Color"].default_value = (0.010, 0.022, 0.028, 1)
gp.inputs["Roughness"].default_value = 1.0
ground.data.materials.append(gmat)


def make_mat(name, color, emit=0.0, rough=0.85):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rough
    try:
        p.inputs["Emission Color"].default_value = (*color, 1)
        p.inputs["Emission Strength"].default_value = emit
    except Exception:
        pass
    return m


bark = make_mat("bark", (0.020, 0.015, 0.012))
canopy_mats = [
    make_mat("c_teal", (0.02, 0.18, 0.16), 0.9),
    make_mat("c_cool", (0.03, 0.11, 0.22), 0.8),
    make_mat("c_warm", (0.34, 0.12, 0.02), 1.0),
    make_mat("c_deep", (0.01, 0.08, 0.07), 0.6),
]


def add_tree(x, y, h):
    r = h * random.uniform(0.09, 0.15)
    bpy.ops.mesh.primitive_cylinder_add(vertices=7, radius=r * 0.16, depth=h * 0.5,
                                        location=(x, y, h * 0.25))
    tr = bpy.context.active_object
    tr.data.materials.append(bark)
    bpy.ops.mesh.primitive_cone_add(vertices=9, radius1=r, radius2=r * 0.04, depth=h * 0.95,
                                    location=(x, y, h * 0.5 + h * 0.475))
    cn = bpy.context.active_object
    cn.data.materials.append(random.choice(canopy_mats))


for i in range(120):
    x = random.uniform(-50, 50)
    if abs(x) < 4.0:                       # keep the camera corridor clear
        x += 8 if x >= 0 else -8
    add_tree(x, random.uniform(-230, 30), random.uniform(6, 14))

# ---- camera ---------------------------------------------------------------
bpy.ops.object.camera_add(location=(0, -210, 3.2),
                          rotation=(math.radians(90), 0, 0))
cam = bpy.context.active_object
sc.camera = cam
cam.data.lens = 32
cam.data.dof.use_dof = True
cam.data.dof.focus_distance = 18
try:
    cam.data.dof.aperture_fstop = 2.4
except Exception:
    pass

for f in range(1, NFRAMES + 1):
    t = (f - 1) / max(NFRAMES - 1, 1)
    cam.location.y = -210 + t * 240
    cam.location.x = 1.6 * math.sin(t * math.pi * 3.0)
    cam.location.z = 3.2 + 0.35 * math.sin(t * math.pi * 5.0)
    cam.rotation_euler = (math.radians(90), math.radians(-4.0 * math.sin(t * math.pi * 2.0)), 0)
    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)

# ---- lights ---------------------------------------------------------------
bpy.ops.object.light_add(type='AREA', location=(30, 20, 60))
key = bpy.context.active_object
key.data.energy = 7000
key.data.size = 40
key.data.color = (0.85, 0.95, 1.0)

bpy.ops.object.light_add(type='AREA', location=(-40, -40, 25))
rim = bpy.context.active_object
rim.data.energy = 3500
rim.data.size = 30
rim.data.color = (1.0, 0.6, 0.3)

bpy.ops.object.light_add(type='SUN')
sun = bpy.context.active_object
sun.data.energy = 0.4
sun.data.angle = math.radians(3.0)          # soft shadows
sun.rotation_euler = (math.radians(40), 0, math.radians(30))


# ---- render helpers -------------------------------------------------------
def render_still(path, frame):
    sc.frame_set(frame)
    ims = sc.render.image_settings
    ims.media_type = "IMAGE"
    ims.file_format = "JPEG"
    ims.quality = 85
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


if TEST:
    render_still(os.path.join(MEDIA, "_demo_test"), int(NFRAMES * 0.5))
    print("TEST DONE ->", os.path.join(MEDIA, "_demo_test.jpg"))
    sys.exit(0)

# poster frame (IMAGE/JPEG)
render_still(os.path.join(MEDIA, "scrub-poster"), int(NFRAMES * 0.5))

# animation -> all-intra H.264 MP4 (keyframe every frame)
r = sc.render
ims = r.image_settings
ims.media_type = "VIDEO"
ims.file_format = "FFMPEG"
ff = r.ffmpeg
ff.format = "MPEG4"
ff.codec = "H264"
ff.gopsize = 1                              # <-- all-intra: instant scrubbing
ff.constant_rate_factor = "MEDIUM"
ff.ffmpeg_preset = "GOOD"
ff.audio_codec = "NONE"
r.filepath = os.path.join(MEDIA, "scrub-film")
bpy.ops.render.render(animation=True)

produced = sorted(glob.glob(os.path.join(MEDIA, "scrub-film*.mp4")))
target = os.path.join(MEDIA, "scrub-film.mp4")
if produced and produced[-1] != target:
    os.replace(produced[-1], target)
print("DONE ->", target, os.path.getsize(target), "bytes")
