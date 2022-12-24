import Glview from './glview.js';

const _fs = /*glsl*/`#version 300 es
    precision mediump float;
    in vec3 vcolor;
    out vec4 fragColor;
    uniform float time;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float a;
    #define g gl_FragCoord

    void main() {
    	vec3 col = cos(vec3(.5,1.,1.5))*.5+.5;
    	float c = a*(cos((mouse.x*g.x+mouse.y*g.y)/20.)*.2+.2);
        fragColor = vec4(col, 1.-c);
    }
`;

const _fs_ = /*glsl*/`#version 300 es
    precision mediump float;
    out vec4 fragColor;

    uniform float time;
    uniform vec2 resolution;
    uniform vec2 mouse;

    #define glf gl_FragCoord

    void main() {
    	vec2 uv = (2.*glf.xy-resolution.xy)/resolution.y;
    	float f = dot((1.+mouse.y*18.)*uv,uv);
    	vec3 col = vec3(.1/f);
        fragColor = vec4(col, 1.);
    }
`;

const prog = {
	arrays: {
		position: {
			components: 2,
			stride:5,
			offset: 0,
			data: [
				-1,-1, 0,1,0,
				1,-1,  0,0,1,
				-1,1,  0,0,1,
				1,1,   1,0,0,
			]
		},
		color: {
			components: 3,
			stride:5,
			offset: 2,
			data: 'position'
			// data: [.5,.2,.3, .2, .4, .9, .1,.2,.3, .6, .4, .2,]
		}
	},
	uniforms: {a: 1},
	drawMode: 'TRIANGLE_STRIP'
}

const prog2 = {
	arrays: {}, // empty object uses previous vao
	fs : _fs,
	uniforms: {a:4}
}

const prog3 = {
	arrays: {
		position: {
			components: 2,
			data: [-.3,-.3,  .3,-.3, 0,.2]
		},
		color:{
			components: 3,
			data: [.4,0,.8, .1,0,.8, .4,.5,.7]
		}
	},
	uniforms: {a: 1}
}

prog.chain = [prog2, prog3]

const progg = {
	fs: _fs_,
	clearcolor: [.1,.2,.3,1],
	uniforms: {}
}

const glview = new Glview(document.querySelector('canvas'), prog, [500,500]);
glview.start()
