//ui
export const HAIR_IS_BODYPART = false

//api
export const BODYCOLOR3 = true
export const ENABLE_API_CACHE = true

//layered clothing
export const ENABLE_LC_WEIGHT_CACHE = true
export const INFLATE_LAYERED_CLOTHING: number = 0.05 //only used by linear algorithms
export const LAYERED_CLOTHING_ALGORITHM: "linear" | "linearnormal" | "linearnormal2" | "rbf" = "rbf"

export const RBF_PATCH_COUNT = 256 //amount of "patches" that are used for layered clothing, multiple verts share the same patch
export const RBF_PATCH_DETAIL_SAMPLES = 48 //amount of nearby vertices each patch samples from
export const RBF_PATCH_SHAPE_SAMPLES = 32 //amount of far-away vertices (importants) each patch samples from, this is done so that the overall mesh shape is preserved

//general rendering
export const USE_VERTEX_COLOR = true
export const USE_LEGACY_SKELETON = false
export const USE_POST_PROCESSING = false //this is needed to enable bloom, but ugly since it disables anti aliasing...

//debug
export const LOAD_TEST_PLACE = false //"../assets/DecalTest2.rbxm" //"../assets/TransparentDominus.rbxm" //"../assets/EmissiveTest.rbxm" //"../assets/Mesh Deformation Test.rbxl" //set this to a string to load a place file
export const SHOW_SKELETON_HELPER = false
export const ANIMATE_SKELETON = true