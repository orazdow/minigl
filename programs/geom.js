import {solids, polyhedra, models} from './model.js';
import {loadObj, edgeList} from './loader.js';
import {mat_mul_4, proc_rows, create_rot, create_proj} from './render.js';
import * as mat4 from './glm/mat4.js';


const vs =/*glsl*/`#version 300 es
	precision mediump float;
	in vec3 position;
	uniform float time;
	uniform vec3 ax;
	uniform mat4 pmat;
	uniform float zdist;
	uniform float v_amp;

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
    	vec3 pos = v_amp*position*r;
    	pos.z += zdist; //sin(time)*.5+.5;
        gl_Position = vec4(pos,1)*pmat;
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
var p_fov = .8;
var p_near = -2; 
var p_far = 6;

function setup(pgm){
	pgm.uniforms.pmat = mat4.create();
	mat4.perspective(pgm.uniforms.pmat, p_fov, 1, p_near,p_far);
	prog.drawMode = 'TRIANGLES';
	// prog.drawMode = 'LINES';
	loadModel(pgm, polyhedra, 8, .8, true);
}


function loadModel(pgm, set, idx, amp=.8, tilt){
	let model = load(set, idx, amp);
	if(tilt){
		let rmat = create_rot(.2, -.1, -.1);
		model.v = mat_mul_4(model.v, rmat)
	}
	if(pgm.drawMode === 'LINES'){
		pgm.arrays.position.data = getLines(model);
	}else{
		pgm.arrays.position.data = getPrisms(model, .005);//getQuads(model, .0036);
	} 

}

function load(set, idx, amp=.5){
    let obj = loadObj(Object.values(set)[idx], amp);
    let o = {v: obj.vertices.v, i: obj.indices.v};
    o.i = edgeList(o.i);
    return o;
}

function flatten(mat){
	let a = [];
	for(let v of mat) a.push(...v);
	return a;
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

function getPrisms(model, w=.1){
	let arr = [];
	for(let el of model.i){
		let a = model.v[el[0]];
		let b = model.v[el[1]];
		let p = trianglePrism(a, b, w);
		for(let t of p){
			for(let v of t){
				arr.push(...v.slice(0,3));
			}
		}		
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

function trianglePrism(a, b, w=.1){
	let n = normal(a, b);  
	let v_al = addv(mults(n, -w), a);
	let v_ar = addv(mults(n,  w), a);
	let v_bl = addv(mults(n, -w), b);
	let v_br = addv(mults(n,  w), b); 
    let r = 0.86602540379;
    let n2 = normalize(cross(n, subv(a, b)));
    let v_aa = addv(a, mults(n2, 2*w*r));
    let v_bb = addv(b, mults(n2, 2*w*r));
    return [
      [v_al, v_ar, v_bl], 
      [v_ar, v_bl, v_br],
      [v_al, v_aa, v_bb],
      [v_al, v_bb, v_bl],
      [v_ar, v_aa, v_bb],
      [v_ar, v_bb, v_br]
    ]; //no end caps, not concentric with line
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
    let d = subv(a, b);
    let d2 = [...d];
    let idx = 2;
    if(d[0]==0) idx = 0;
    if(d[1]==0) idx = 1;
    d[idx] = 0; d2[idx] = 1;
    return normalize(cross(d, d2)); 
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
			idx: 0,
			min: 0,
			max: Object.keys(polyhedra).length-1,
			step: 1,
			onChange: (i)=>{
				loadModel(prog, polyhedra, i, .8, 0);
				let gl = prog.ctl.gl;
				let mgl = prog.ctl.mgl;
				mgl.setBufferData(gl, prog, 'position', prog.arrays.position);
				prog.ctl.frame();
			}
		},
		{
			rz: 0,
			min: 0,
			max: 1,
			step: .01,
			onChange: (v)=>{
				prog.uniforms.ax[2] = v;
			}
		},
		{
			ry: 0,
			min: 0,
			max: 1,
			step: .01,
			onChange: (v)=>{
				prog.uniforms.ax[1] = v;
			}
		},
		{
			rx: 0,
			min: 0,
			max: 1,
			step: .01,
			onChange: (v)=>{
				prog.uniforms.ax[0] = v;
			}
		},
		{
			z: [1, 0, 4, .01],
			onChange: (v)=>{
				prog.uniforms.zdist = v;
				prog.ctl.frame()
			}
		},
		{
			amp: [1., .5, 5, .01],
			onChange: (v)=>{
				prog.uniforms.v_amp = v;
				prog.ctl.frame();
			}
		},
		{
			pfov: [.8, .1, 2, .01],
			onChange: (v)=>{
				p_fov = v;
				mat4.perspective(prog.uniforms.pmat, p_fov, 1, p_near, p_far);
			}
		},
		{
			pnear: [-2, -4, 0, .1],
			onChange: (v)=>{
				p_near = v;
				mat4.perspective(prog.uniforms.pmat, p_fov, 1, p_near, p_far);
			}
		},
		{
			pfar: [6, 0, 12, .1],
			onChange: (v)=>{
				p_far = v;
				mat4.perspective(prog.uniforms.pmat, p_fov, 1, p_near, p_far);
			}
		},
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
		ax: [.0,.0,.0],
		pmat: [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
		zdist: 1, 
		v_amp: 1
	},
	gui: gui
};

export default prog;