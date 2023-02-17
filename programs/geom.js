import {solids, polyhedra, models} from './model.js';
import {loadObj, edgeList} from './loader.js';
import {mat_mul_4, create_rot, create_proj} from './render.js';

const vs =/*glsl*/`#version 300 es
	precision mediump float;
	in vec3 position;
	uniform float time;
	uniform vec3 ax;

	mat3 rotz(float t){
		return mat3(cos(t), -sin(t), 0, sin(t), cos(t), 0, 0,0,1);
	}
	mat3 roty(float t){
		return mat3(cos(t), 0, sin(t), 0, 1, 0, -sin(t), 0, cos(t));
	}
	mat3 rotx(float t){
		return mat3(1, 0, 0, 0, cos(t), -sin(t), 0, sin(t), cos(t));
	} 

    void main(){
    	mat3 r = rotz(time*ax.z)*roty(time*ax.y)*rotx(ax.x);
        gl_Position = vec4(position*r, 1);
    }
`;

const fs = /*glsl*/`#version 300 es
    precision mediump float;

    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    uniform vec3 hsl;
    out vec4 fragColor;

	vec3 hsv2rgb(vec3 c){
	    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
	}
    void main() {
    	vec2 uv = gl_FragCoord.xy/resolution.xy;
    	vec3 col = hsv2rgb(hsl);
        fragColor = vec4(col, 1.);
    }
`;

var model;

function setup(pgm){
	model = load(polyhedra, 8, .8);
	let rmat = create_rot(.2, -.1, -.1);
	model.v = mat_mul_4(model.v, rmat); 

	// pgm.max_count = model.i.length*4;
	// prog.arrays.position.data = getQuads(model, .0036);
	// prog.drawMode = 'TRIANGLES';

	pgm.max_count = model.i.length*2;
	prog.arrays.position.data = getLines(model);
	prog.drawMode = 'LINES';
}

function load(set, idx, amp=.5){
    let obj = loadObj(Object.values(set)[idx], amp);
    let o = {v: obj.vertices.v, i: obj.indices.v};
    o.i = edgeList(o.i);
    return o;
}

function getLines(model){
	let arr = [];
	for(let el of model.i){
		let a = model.v[el[0]].slice(0,3);
		let b = model.v[el[1]].slice(0,3);	
		arr.push(...a, ...b);	
	}
	return arr;
}

function getQuads(model, w=.1){
	let arr = [];
	for(let el of model.i){
		let a = model.v[el[0]];
		let b = model.v[el[1]];
		let q = triangleQuad(a, b, w);
		arr.push(...q[0].slice(0,3),
				...q[1].slice(0,3),
				...q[2].slice(0,3),
				...q[3].slice(0,3),
				...q[4].slice(0,3),
				...q[5].slice(0,3),);		
	}
	return arr;
}

function triangleQuad(a, b, w=.1){
	let n = normal(a, b);
	let v1 = addv(mults(n, -w), a);
	let v2 = addv(mults(n,  w), a);
	let v3 = addv(mults(n, -w), b);
	let v4 = addv(mults(n,  w), b); 
	return [v1,v2,v3, v2,v3,v4];
}

function normal(a, b){
	let d = subv(b, a);
	return normalize([-d[1], d[0], d[2]])
}

function normalize(v){
  let d = Math.sqrt(v[0]**2+v[1]**2+v[2]**2) || 1;
  return mults(v, 1/d);
}
function cross(a, b){
   return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0],1];
}
function addv(a, b){
    return [a[0]+b[0], a[1]+b[1], a[2]+b[2], 1];
}
function subv(a, b){
    return [a[0]-b[0], a[1]-b[1], a[2]-b[2], 1];
}
function multv(a, b){
    return [a[0]*b[0], a[1]*b[1], a[2]*b[2], 1];
}
function mults(v, s){
    return [v[0]*s, v[1]*s, v[2]*s, 1];
}
function adds(v, s){
    return [v[0]+s, v[1]+s, v[2]+s, 1];
}

const gui = {
	name: 'geom',
	open: true,
	fields: [
		{
			z: 0,
			min: 0,
			max: 1,
			step: .01,
			onChange: (v)=>{
				prog.uniforms.ax[2] = v;
			}
		},
		{
			y: 0,
			min: 0,
			max: 1,
			step: .01,
			onChange: (v)=>{
				prog.uniforms.ax[1] = v;
			}
		},
		{
			x: 0,
			min: 0,
			max: 1,
			step: .01,
			onChange: (v)=>{
				prog.uniforms.ax[0] = v;
			}
		}
	]
}

const prog = {
	fs: fs,
	vs: vs,
	arrays: {
		position: {
			components: 3,
			data: [-1,-1,0, 1,-1,0,  -1,1,0,  1,1,0]
		}
	},
	setupcb: setup,
	uniforms: {
		hsl: [.5,1,.8],
		ax: [.0,.0,.0]
	},
	gui: gui
};

export default prog;