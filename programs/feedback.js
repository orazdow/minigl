const trails = /*glsl*/`#version 300 es 
    precision mediump float;
    in vec3 vcolor;
    out vec4 fragColor;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    uniform sampler2D backbuffer;
    #define res resolution

    void main(){
        vec2 uv = (2.*gl_FragCoord.xy-res)/res.y;
        vec2 tuv = gl_FragCoord.xy/res;
        float t = time*2.;
        vec3 c = vec3(.2/length(.8*vec2(cos(t*.7),sin(t))-uv*1.5));
        vec3 b = texture(backbuffer, tuv).xyz;
        c = mix(c*vec3(.3,.6, 1),b, .93);
        fragColor = vec4(c, 1);
    }
`;

const prog = {
    fs: trails,
    targets: {
        texture: true,
        renderbuffer: true,
        textureUniform: 'backbuffer'

    },
    // uniforms:{
    //     backbuffer: 1
    // }
};

export default prog;