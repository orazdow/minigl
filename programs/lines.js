const {cos, sin} = Math;
const fs = /*glsl*/`#version 300 es
    precision mediump float;
    in vec3 vcolor;
    out vec4 fragColor;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    uniform vec2 points[32];
    #define num 16
    #define glf gl_FragCoord
    #define res resolution
    #define WEIGHT (3./res.x)

    // shadertoy.com/view/MsjSzz TDM
    float line(vec2 p, vec2 p0, vec2 p1, float w) {
        vec2 d = p1 - p0;
        float t = clamp(dot(d,p-p0) / dot(d,d), 0.0,1.0);
        vec2 proj = p0 + d * t;
        float dist = length(p - proj);
        dist = 1.0/dist*WEIGHT*w;
        return min(dist*dist,1.0);
    }

    void main() {
        vec2 uv = (2.*glf.xy-res.xy)/res.y;
        float f = 0.;
        for(int i = 0; i < num; i+=2){
            f += line(uv, points[i], points[i+1], .8);
        }
        fragColor = vec4(f,f,f, 1.);
    }
`;

const points = new Array(64);

function setupcb(pgm){
    for(let i = 0; i < prog.uniforms.points.length/2; i+=2){
        let t = (i/prog.uniforms.points.length)*6.28;
        prog.uniforms.points[i] = cos(t*prog.uniforms.a);
        prog.uniforms.points[i+1] = sin(prog.uniforms.b*t*prog.uniforms.a);
    }
}

const gui = {
    name:'lj',
    open: true,
    updateFrame: true,
    fields: [
    {
        a: 1,
        min: .1,
        max: 8,
        step: .1,
        onChange: (v)=>{
            prog.uniforms.a = v;
            setupcb(prog)
        }
    },
    {
        b: 1,
        min: .1,
        max: 8,
        step: .1,
        onChange: (v)=>{
            prog.uniforms.b = v;
            setupcb(prog)
        }
    }
    ]
}

const prog = {
    // arrays: {},
    fs : fs,
    setupcb : setupcb,
    // rendercb : rendercb,
    uniforms : {
        points: points,
        a: 1,
        b: 1
    },
    gui : gui,
    // on: false,
};

export default prog;