export const particle_vertexShader = `
attribute vec3 instanceColor;
attribute vec2 instanceSeedTime;
attribute float instanceOpacity;

varying vec2 vUv;
varying vec3 vInstanceColor;
varying float vInstanceOpacity;
varying vec2 vInstanceSeedTime;

uniform float uZOffset;

void main() {
    vUv = uv;
    vInstanceColor = instanceColor;
    vInstanceOpacity = instanceOpacity;
    vInstanceSeedTime = instanceSeedTime;

    vec4 modelViewPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    modelViewPosition.z += uZOffset;

    gl_Position = projectionMatrix * modelViewPosition;
}
`

export const particle_fragmentShader = `
varying vec2 vUv;
varying vec3 vInstanceColor;
varying float vInstanceOpacity;
varying vec2 vInstanceSeedTime;

uniform sampler2D uColorMap;
uniform sampler2D uAlphaMap;
uniform sampler2D uMap;
uniform float uOpacity;

void main() {
    float seed = vInstanceSeedTime.x;
    float time = vInstanceSeedTime.y;

    // Sample the texture using the UV coordinates
    vec4 texColor = texture2D(uMap, vUv);
    vec4 alphaTex = texture2D(uAlphaMap, vec2(time, seed)); 
    vec4 colorTex = texture2D(uColorMap, vec2(time, seed));

    // Tint texture with our color
    vec4 tintedColor = texColor * vec4(vInstanceColor, 1.0);

    // Apply opacity to the texture alpha
    vec4 opacityColor = tintedColor * vec4(1.0, 1.0, 1.0, uOpacity * vInstanceOpacity) * alphaTex.r;

    // Apply that weird color things sparkles have
    vec4 finalColor = opacityColor;
    finalColor.rgb = mix(opacityColor.rgb, opacityColor.rgb * colorTex.rgb, colorTex.a * opacityColor.a);

    gl_FragColor = finalColor;
}
`