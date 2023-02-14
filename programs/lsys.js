import lsystem from './l-system.js';
import rules from './selectrules.js';
// import * as g from './render.js';

const fs = /*glsl*/`#version 300 es
    precision mediump float;
    in vec3 vcolor;
    out vec4 fragColor;
    #define num_points 540
    const float tau = 6.2831853;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    uniform vec3 points[num_points];
    uniform float weight;
    uniform float a;
    uniform float rot_n;
    uniform int lim;
  
    #define glf gl_FragCoord
    #define res resolution
    #define WEIGHT (3./res.x)

    mat2 rot(float t){
        return mat2(cos(t), -sin(t), sin(t), cos(t));
    }

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
        const int num_lines = num_points/2; 
        vec2 uv = (2.*glf.xy-res.xy)/res.y;
        float d = tau/rot_n;
        float f = 0.;
        for(int i = 0; i < num_lines; i++){
            if(i > int(lim)) break;
            int ia = i*2, ib = i*2+1;
            for(float t = 0.; t < tau; t+= d){
               f += line(uv, points[ia].xy*a*rot(t), 
                points[ib].xy*a*rot(t), weight);             
            }

        }
        fragColor = vec4(f,f,f, 1.);
    }
`;

const {cos, sin, sqrt, log, min, max, floor, round, random, PI} = Math;

var model;
var lev = 1;
var n_i = 0; 
var rot_n = 4;
var theta = 0;
var recenter = false;
var seed = 44; 

const num_points = 540;

var arr = new Array(num_points*3);

function buildModel(rule){
	return lsystem(rules[rule], n_i, recenter, seed);
}

function setupcb(pgm){
	model = buildModel(1, 0, 0, 0);
	let v = vec_uniforms(model, num_points);
	arr.splice(0, num_points*3, ...v);
}

function vec_uniforms(model, limit){
	let  arr = [];
	for(let i = 0; i < model.i.length; i++){
		if(i*2 >= limit) break;
        let a = model.v[model.i[i][0]].slice(0, 3);
        let b = model.v[model.i[i][1]].slice(0, 3);
        arr.push(...mults(a,1));
        arr.push(...mults(b,1));
	}
	return arr;
}

function mults(v, s){
    return [v[0]*s, v[1]*s, v[2]*s];
}

const gui = {
    name: 'lsys', 
    open: true,
    updateFrame: true,
    fields: [
        {
            weight: .2,
            min: .01,
            max: 1.5,
            step: .01,
            onChange: (v)=>{
                prog.uniforms.weight = v;
            }
        },
        {
            a: 1,
            min: .5,
            max: 5,
            step: .01,
            onChange: (v)=>{
                prog.uniforms.a = v;
            }
        },
        {
            limit: 1,
            min: 0,
            max: 1, 
            step: .01,
            onChange: (v)=>{
                prog.uniforms.lim = v*(num_points*.5);
            }
        },
        {
            rot: 1,
            min: 1,
            max: 6, 
            step: 1,
            onChange: (v)=>{
                prog.uniforms.rot_n = v;;
            }
        }
    ]
}

const prog = {
	fs: fs,
	setupcb: setupcb,
	uniforms: {
		points: arr, 
        weight: .2,
        a: 1, 
        lim: num_points/2,
        rot_n: 1
	},
    gui: gui
}

export default prog;