import lsystem from './l-system.js';
import rules from './selectrules.js';

const vs =/*glsl*/`#version 300 es
	in vec3 position;
	uniform float vrot;
	uniform vec2 dir;
    
    void main() {
    	mat2 rot = mat2(cos(vrot), -sin(vrot), sin(vrot), cos(vrot));
        gl_Position = vec4(dir*position.xy*rot, 0.,1.);
    }
`;

const fs = /*glsl*/`#version 300 es
    precision mediump float;
    out vec4 fragColor;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    #define glf gl_FragCoord

    void main() {
    	vec2 uv = gl_FragCoord.xy/resolution.xy;
    	vec3 col = vec3(0); //cos(uv.xyy*time+vec3(1,2,3))*.5+.5;
        fragColor = vec4(col, 1.);
    }
`;

var model;
var lev = 1;
var n_i = 0; 
var rot_n = 4;
var theta = 0;
var recenter = false;
var seed = 404; 

function setupcb(pgm){
	model = buildModel(1, 0, 0, 0);
	// console.log(model.i.length)
	// let quads = getQuads(model, .0025);
	// prog.arrays.position.data = quads;
	prog.arrays.position.data = getLines(model);
	pgm.draw = pgm.ctl.draw2;
}

function buildModel(rule){
	return lsystem(rules[rule], n_i, recenter, seed);
}

function getLines(model){
	let arr = [];
	for(let el of model.i){
		let a = model.v[el[0]].slice(0,3);
		let b = model.v[el[1]].slice(0,3);	
		arr.push(...a, ...b)	
	}
	return arr;
}

function getQuads(model, w=.1, d=.0){
	let arr = []
	for(let el of model.i){
		let a = model.v[el[0]];
		let b = model.v[el[1]];
		let q = lineQuad(a, b, w, d);
		arr.push(...q[0].slice(0,3),
			...q[1].slice(0,3),
			...q[2].slice(0,3),
			...q[3].slice(0,3));
	}
	return arr;
}

function lineQuad(a, b, w=.1, d=.0){
	let n = normal(a, b);
	let l = d? mults(normalize(subv(b,a)),-d):[0,0,0,0];
	let v1 = addv(mults(n, -w), addv(a,l));
	let v2 = addv(mults(n, w), addv(a,l));
	let v3 = addv(mults(n, -w), subv(b,l));
	let v4 = addv(mults(n, w), subv(b,l)); 
	return [v1,v2,v3,v4];
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

const prog = {
	setupcb: setupcb,
	drawMode: 'LINES',
	arrays: {
		position: {
			components: 3,
			data: [-1,-1,0, 1,-1,0,  -1,1,0,  1,1,0]
		}
	},
	fs:fs,
	vs:vs,
	uniforms: {
		vrot: 0,
		dir: [1,1]
	}
};

export default prog;