const fs = /*glsl*/`#version 300 es 
precision highp float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform float a;
out vec4 fragColor;
// uniform sampler2D bufferA;

void main(){
    vec2 uv = gl_FragCoord.xy/resolution.xy;
    float f = 0.;
    for(float i = 0.1; i < .7; i += .1){
        f = f-mix(f, log(1.1+pow(cos(a*2./length(i*(uv-(.2+.5*i))*i)+time*.5),3.))/i, .4);
    }
    vec3 c = vec3(f);
    fragColor = vec4(c*.2,f);
}
`;

const fs2 = /*glsl*/`#version 300 es 
precision highp float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
out vec4 fragColor;

    float rand(vec2 n) { 
        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float noise(vec2 p){
        vec2 ip = floor(p);
        vec2 u = fract(p);
        u = u*u*(3.0-2.0*u);
        
        float res = mix(
            mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
            mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
        return res*res;
    }

    void main(){
        vec2 uv = gl_FragCoord.xy/resolution.xy;
        vec3 c = vec3(noise(44.+uv*10.));
        fragColor = vec4(c,1);
    }

`;
/*
const prog = {
    fs: fs2,
    chain: [
        {
            fs:fs,
            // clear: 1
        }
    ]
}*/

const gui = {
    name: 'ring',
    // open: 1,
    switch: 1,
    updateFrame: 1,
    fields: [
        {
            a: [.6, .1, 1, .1],
            onChange: (v)=>{
                prog.uniforms.a = v;
            }
        }
    ]
}

const prog = {
    fs: fs,
    arrays: {},
    gui: gui,
    uniforms: {
        a: .6
    }
}

export default prog;