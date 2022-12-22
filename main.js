import {createShaderProgram, createBuffers, enableAttributes, setUniforms, drawObj} from './minigl.js';

const vs =/*glsl*/`#version 300 es

	in vec2 position;
	in vec3 color;
	out vec3 vcolor;
    
    void main() {
    	vcolor = color;
        gl_Position = vec4(position, 0., 1.);
    }
`;

const fs = /*glsl*/`#version 300 es

    precision mediump float;
    in vec3 vcolor;
    out vec4 fragColor;
    uniform float a;
    #define g gl_FragCoord

    void main() {
    	vec3 col = vcolor + .5*a*(cos((g.x+g.y)/20.)*.2+.2);
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
		}
	},
	uniforms: {a: 0},
	fs: fs,
	vs: vs,
	drawMode: 'TRIANGLE_STRIP',
	shaderProgram: null,
	subPrograms: null // [{fs, uniforms, cbs},]
}

const prog2 = {
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
	uniforms: {a: 1},
	fs: fs,
	vs: vs
}

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
var clearcolor = [.5,.5,.5,1];
gl.clearColor(...clearcolor);
gl.clear(gl.COLOR_BUFFER_BIT);

// need fragcoord res, mouse, time uniforms
createShaderProgram(gl, prog); 
createBuffers(gl, prog); 

createShaderProgram(gl, prog2); 
createBuffers(gl, prog2); 

enableAttributes(gl, prog);
setUniforms(gl, prog)
drawObj(gl, prog);

enableAttributes(gl, prog2);
setUniforms(gl, prog2)
drawObj(gl, prog2);