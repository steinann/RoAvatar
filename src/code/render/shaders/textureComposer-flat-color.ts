import * as THREE from 'three'

const vertexShader = `
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform vec3 uColor;
void main() {
    gl_FragColor = vec4(uColor, 1.0);
}
`

export const Shader_TextureComposer_Flat_Color = new THREE.ShaderMaterial({
    uniforms: {
        uColor: {value: new THREE.Color(0,0,0)}
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    depthWrite: false,
    transparent: true,
})