import * as THREE from 'three'

const vertexShader = `
uniform mat4 uTextureProjMat;

varying vec2 vUv;
varying vec2 vTextureProjCoord;
varying vec3 vNormal;
void main() {
    vUv = uv;
    vec4 newProjCoord = uTextureProjMat * vec4(position, 1.0);
    vTextureProjCoord = (newProjCoord).xy / newProjCoord.w;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = vec4(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0, 0.0, 1.0);
}
`

const fragmentShader = `
uniform sampler2D uTexture;
uniform vec3 uDecalNormal;

varying vec2 vUv;
varying vec2 vTextureProjCoord;
varying vec3 vNormal;
void main() {
    bool inRange =
                    vTextureProjCoord.x >= 0.0 &&
                    vTextureProjCoord.x <= 1.0 &&
                    vTextureProjCoord.y >= 0.0 &&
                    vTextureProjCoord.y <= 1.0;

    if (!inRange) {
        discard;
    }

    float angle = dot(vNormal, uDecalNormal);
    if (angle < 0.707) {
        discard;
    }

    vec4 texColor = texture2D(uTexture, vTextureProjCoord);
    gl_FragColor = texColor;
}
`

export const Shader_TextureComposer_Decal = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: {value: undefined},
        uTextureProjMat: {value: new THREE.Matrix4().identity()},
        uDecalNormal: {value: new THREE.Vector3(0, 0, 1)}
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    depthWrite: false,
    transparent: true,
})