// https://github.com/pixijs/examples/blob/gh-pages/required/assets/basics/shader.frag

precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float time;

float rando(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec4 noise(vec2 uv, float time) {
    float noiseVal = rando(uv * time);
    return vec4(noiseVal, noiseVal, noiseVal, 1.0);
}

void main(){
    float x = time; // Do something with time or we get errors
    vec4 fg = texture2D(uSampler, vTextureCoord);
    gl_FragColor = fg.rgba;
}