// -*- mode: glsl -*-

const light_vs = /*glsl*/ `#version 300 es

    precision mediump float;
    layout(location = 0) in vec4 position;
    layout(location = 1) in vec4 normal;
    layout(location = 2) in vec2 texcoord;
    uniform mat4 pmat;
    uniform mat4 mmat;
    uniform mat4 vmat;
    uniform mat4 rmat;
    uniform float zdist;
    uniform vec3 lpos;
    uniform float scale;

    uniform mat4 lpmat;
    uniform mat4 lvmat;

    struct Light {
        vec3 pos;
        vec3 dir;
        vec3 col;
        float pow;
        float spec;
        float diff;
        float dz;
        float am;
        float lev;
    };

    uniform Light lighta;
    out Light alight;

    out vec3 vnormal;
    out vec3 vpos;
    out vec4 lvpos;

    void main(){
        vec4 pos = vec4(vec3(scale),1)*position*rmat;
        vnormal = (normal*rmat).xyz;
        pos = mmat*pos;
        // ldir = normalize(lpos - pos.xyz);
        alight = lighta;
        alight.dir = alight.pos - pos.xyz;
        gl_Position = pmat*vmat*pos;
        vpos = pos.xyz;
        lvpos = lpmat*lvmat*pos;
    }

`;

const light_fs = /*glsl*/ `#version 300 es
    precision mediump float;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    uniform sampler2D tex;
    uniform float showDepthTex;

    struct Light {
        vec3 pos;
        vec3 dir;
        vec3 col;
        float pow;
        float spec;
        float diff;
        float dz;
        float am;
        float lev;
    };
    in Light alight;

    in vec3 vnormal;
    in vec3 vpos;
    in vec4 lvpos;

    out vec4 fragColor;

    float lighting(vec3 vnorm, vec3 lpos, float p, float s, float d, float dz, float am){
        vec3 light = normalize(lpos);
        vec3 ray = reflect(-light, vnorm);
        float spec = pow(max(0., dot(light, ray)) ,p);
        float diff = max(0., dot(vec3(light.xy,light.z+dz), vnorm));
        return .3*am + d*diff + s*spec;
    }

    float shadow(vec4 lvpos){
        vec3 p = (lvpos.xyz/lvpos.w)*0.5 + 0.5;
        float d = texture(tex, p.xy).r;
        return (p.z -.002) > d ? 1.0 : 0.0;

    }

    void main(){
        float l = lighting(vnormal, alight.dir, alight.pow, alight.spec, alight.diff, alight.dz, alight.am);
        vec2 uv = (2.*gl_FragCoord.xy-resolution)/resolution.y;
        vec3 c = mix(l*alight.col, texture(tex, uv*.5+.5).rrr, showDepthTex);
        float s = shadow(lvpos);
        vec3 col = mix(c, c*.2, s);
        fragColor = vec4(col, 1);
    }
`;

const depth_vs = /*glsl*/ `#version 300 es
    precision mediump float;
    layout(location = 0) in vec4 position;
    layout(location = 1) in vec4 normal;
    layout(location = 2) in vec2 texcoord;
    uniform mat4 mmat;
    uniform mat4 rmat;
    uniform float scale;
    uniform mat4 lpmat;
    uniform mat4 lvmat;

    void main(){
        vec4 pos = vec4(vec3(scale),1)*position*rmat;
        gl_Position = lpmat*lvmat*mmat*pos;
    }
`;

const depth_fs = /*glsl*/ `#version 300 es
    precision mediump float;
    out float fragColor;

    void main(){
        fragColor = gl_FragCoord.z;
    }
`;


export {
    light_vs,
    light_fs,
    depth_vs,
    depth_fs,
};
