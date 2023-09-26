const vs =/*glsl*/`#version 300 es
    in vec3 position;
    in vec2 texcoord;
    in vec3 color;

    out vec2 vtex;
    out vec3 vcolor;
    
    void main() {
        vcolor = color;
        vtex = texcoord;
        gl_Position = vec4(position, 1.);
    }
`;

const fs = /*glsl*/`#version 300 es
    precision mediump float;
    in vec3 vcolor;
    in vec2 vtex;

    out vec4 fragColor;
    uniform float time;
    uniform vec2 resolution;
    uniform sampler2D u_tex;

    void main() {
        vec2 uv = (2.*gl_FragCoord.xy-resolution)/resolution.y;
        vec3 col = uv.xyx*cos(time+vec3(1,2,3)*2.)*.5+.5;
        vec4 tex = texture(u_tex, vtex);
        fragColor = vec4(tex.xyz*col, 1.);
    }
`;


const prog = {
    arrays: {
        position: {
            components: 2,
            stride:7,
            offset: 0,
            data: [
                -1,-1, 0,0,  0,1,0,
                1,-1,  1,0,  0,0,1,
                -1,1,  0,1,  0,0,1,

                -1,1, 0,1,  0,0,1,
                1,-1, 1,0,  0,0,1,
                1,1,  1,1,  1,0,0,
            ]
        },
        texcoord: {
            components: 2,
            stride:7,
            offset: 2,
            data: 'position'
        },
        color: {
            components: 3,
            stride:7,
            offset: 4,
            data: 'position'
        }
    },
    fs: fs,
    vs: vs,
    uniforms: {},
    textures: [
        {
            uniform: 'u_tex',
            type: null,
            src: '/programs/m-2.jpg',
            min: 'NEAREST',
            mag: 'NEAREST'
        }
    ],
    drawMode: 'TRIANGLES'
}

const prog2 = {
    fs: fs,
    textures: [
        {
            uniform: 'u_tex',
            type: null,
            src: '/programs/m-2.jpg',
            min: 'NEAREST',
            mag: 'NEAREST'
        }
    ],
}

export default prog2;