// -*- mode: glsl -*-

const light_vs = /*glsl*/ `#version 300 es
    precision mediump float;
    layout(location = 0) in vec4 position;
    layout(location = 1) in vec4 normal;
    layout(location = 2) in vec2 texcoord;
    layout(location = 3) in vec4 tangent;
    uniform mat4 pmat;
    uniform mat4 mmat;
    uniform mat4 vmat;
    uniform mat4 rmat;
    uniform float zdist;
    uniform vec3 lpos;
    uniform float scale;
    uniform vec3 viewpos;
    uniform mat4 lpmat;
    uniform mat4 lvmat;

    struct Light {
        vec3 pos;
        vec3 dir;
        vec3 col;
        float pow;
        float spec;
        float diff;
        float am;
        float atten;
    };
    uniform Light lighta;

    out Light alight;
    out vec3 vnormal;
    out vec3 vpos;
    out vec4 lvpos;
    out vec2 vtexcoord;
    out mat3 tbn;

    void main(){
        vec4 pos = vec4(vec3(scale),1)*position*rmat;
        vnormal = (normal*rmat).xyz;
        pos = mmat*pos;
        alight = lighta;
        alight.dir = alight.pos - pos.xyz;
        gl_Position = pmat*vmat*pos;
        vpos = normalize(viewpos - pos.xyz);
        lvpos = lpmat*lvmat*pos;
        vtexcoord = texcoord;
        vec3 t = normalize((vec4(tangent.xyz, 0.)*rmat).xyz);
        vec3 b = cross(normalize(vnormal), t)*tangent.w;
        tbn = mat3(t, b, vnormal);
    }

`;

const light_fs = /*glsl*/ `#version 300 es
    precision mediump float;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    uniform sampler2D depth_tex;
    uniform sampler2D normal_map;
    uniform samplerCube cubemap;
    uniform float bkgd;
    uniform float useTex;
    uniform float useNorm;

    struct Light {
        vec3 pos;
        vec3 dir;
        vec3 col;
        float pow;
        float spec;
        float diff;
        float am;
        float atten;
    };

    in Light alight;
    in vec3 vnormal;
    in vec3 vpos;
    in vec4 lvpos;
    in vec2 vtexcoord;
    in mat3 tbn;
    out vec4 fragColor;

    float lighting(vec3 vnorm, vec3 lpos, vec3 vpos, float p, float s, float d, float am, float atn){
        vec3 light = normalize(lpos);
        vec3 ray = reflect(-light, vnorm);
        float spec = pow(max(0., dot(ray, vpos)) ,p);
        float diff = max(0., dot(light, vnorm));
        float ld = max(1., length(lpos));
        float atten = mix(1., 1./ (1. + .1*ld*ld), atn);
        return .3*am + atten*(d*diff + s*spec);
    }

    vec3 envMap(samplerCube env, vec3 view, vec3 norm){
        vec3 dir = refract(-view, normalize(norm), 0.95); //reflect(-view, norm);
        return texture(env, dir).rgb;
    }

    float shadow(vec4 lvpos){
        vec3 p = (lvpos.xyz/lvpos.w)*0.5 + 0.5;
        if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return 0.0;
        if (p.z < 0.0 || p.z > 1.0) return 0.0;
        float d = texture(depth_tex, p.xy).r;
        return (p.z - 0.0005) > d ? 1.0 : 0.0;
    }

    void main(){
        vec3 tnorm = texture(normal_map, 12.*vtexcoord).xyz;
        tnorm = normalize(tnorm*2. -1.);
        vec3 texnormal = mix(normalize(vnormal), (tbn * tnorm), vec3(useNorm)*.5);
        vec2 uv = (2.*gl_FragCoord.xy-resolution)/resolution.y;
        float l = lighting(texnormal, alight.dir, vpos, alight.pow, alight.spec, alight.diff, alight.am, alight.atten);
        // vec3 env = envMap(cubemap, vpos, texnormal);
        vec3 c = l*alight.col;
        c = mix(c, c*.2, shadow(lvpos));
        fragColor = vec4(c, 1);
    }
`;

const sky_vs = /*glsl*/ `#version 300 es
    precision mediump float;
    in vec4 position;
    uniform mat4 pmat;
    uniform mat4 vmat;
    out mat4 inversevp;

    void main(){
        inversevp = inverse(vmat)*inverse(pmat);
        gl_Position = position;
    }
`;

const sky_fs = /*glsl*/ `#version 300 es
    precision mediump float;
    uniform vec2 resolution;
    uniform samplerCube cubemap;
    in mat4 inversevp;
    out vec4 fragColor;

    void main(){
        vec2 uv = (2.*gl_FragCoord.xy-resolution)/resolution.y;
        vec4 skypos = inversevp*vec4(uv, 1, 1);
        vec3 col = texture(cubemap, skypos.xyz).rgb;
        fragColor = vec4(col*2., 1);
    }
`;

const depth_vs = /*glsl*/ `#version 300 es
    precision highp float;
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
    precision highp float;
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
    sky_vs,
    sky_fs,
};
