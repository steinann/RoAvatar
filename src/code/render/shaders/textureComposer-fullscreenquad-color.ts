import * as THREE from 'three'

const vertexShader = `
void main() {
    gl_Position = vec4(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0, 0.0, 1.0);
}
`

const fragmentShader = `
uniform vec3 uColor;
void main() {
    gl_FragColor = vec4(uColor, 1.0);
}
`

export const Shader_TextureComposer_FullscreenQuad_Color = new THREE.ShaderMaterial({
    uniforms: {
        uColor: {value: new THREE.Color(0,0,0)}
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    depthWrite: false,
    transparent: true,
})