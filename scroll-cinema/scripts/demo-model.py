"""Generate the original CC0 hero model for Scroll-Cinema.

Builds a faceted crystal on a small rock base, entirely from procedural Blender
primitives — no external assets. Exported to assets/Objects/hero.glb and shipped
under the repository license, so the demo model is safe to redistribute.

Usage:
  blender --background --python scripts/demo-model.py
"""
import bpy, os, math

ROOT = os.getcwd()
OUT = os.path.join(ROOT, "assets", "Objects")
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color, metallic=0.0, rough=0.4, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Metallic"].default_value = metallic
    p.inputs["Roughness"].default_value = rough
    try:
        p.inputs["Emission Color"].default_value = (*color, 1)
        p.inputs["Emission Strength"].default_value = emit
    except Exception:
        pass
    return m


crystal_mat = mat("crystal", (0.05, 0.35, 0.42), metallic=0.15, rough=0.12, emit=0.55)
rock_mat = mat("rock", (0.06, 0.07, 0.08), metallic=0.0, rough=0.9)

parts = []

# faceted crystal (icosahedron, stretched, flat-shaded)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0, location=(0, 0, 2.1))
crystal = bpy.context.active_object
crystal.scale = (1.0, 1.0, 1.75)
crystal.rotation_euler = (0, 0, math.radians(22))
for p in crystal.data.polygons:
    p.use_smooth = False
crystal.data.materials.append(crystal_mat)
parts.append(crystal)

# rock base: three chunky low-poly stones
rocks = [((-1.15, 0.5, 0.35), 1.05), ((1.05, -0.25, 0.28), 0.85), ((0.15, 1.15, 0.24), 0.7)]
for i, (loc, sc) in enumerate(rocks):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0, location=loc)
    rock = bpy.context.active_object
    rock.scale = (sc, sc * 0.9, sc * 0.6)
    rock.rotation_euler = (0.3 * i, 0.4 * i, 0.7 * i)
    for p in rock.data.polygons:
        p.use_smooth = False
    rock.data.materials.append(rock_mat)
    parts.append(rock)

bpy.ops.object.select_all(action='DESELECT')
for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = crystal

out = os.path.join(OUT, "hero.glb")
bpy.ops.export_scene.gltf(
    filepath=out,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_materials='EXPORT',
)
print("MODEL DONE ->", out, os.path.getsize(out), "bytes")
