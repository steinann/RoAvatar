import * as THREE from 'three'

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform sampler2D uTexture;
varying vec2 vUv;
void main() {
    // Sample the texture using the UV coordinates
    vec4 texColor = texture2D(uTexture, vUv);
    gl_FragColor = texColor;
}
`

export const Shader_TextureComposer_Flat = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: {value: undefined}
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    depthWrite: false,
    transparent: true,
})