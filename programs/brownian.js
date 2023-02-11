const fshader = /*glsl*/`#version 300 es

	precision mediump float;

	uniform vec2 points[64];
	uniform float radius;
	uniform float time;
	uniform vec2 resolution;
	uniform int num;
	out vec4 fragColor; 

	void main(){

		float c = 0.0;

	    vec2 uv = (2.*gl_FragCoord.xy-resolution.xy)/resolution.y;

	    for(int i = 0; i < num; i++){
	    	c += radius/distance(uv, points[i]);
	    }

	    c *=0.002;
	    // c /= float(num);
    	fragColor = vec4( vec3(1.), c*smoothstep(0.2,0.9,c) );

	}

`;

let xypoints = [];
xypoints.length = 64;
xypoints.fill(0);

let amount = 0.003;
let rad = 4.0;
let _sink = 0;
let cnt = 0;
let interval = 2;
let hz = 2.*0.0167/interval;
let coef = 1;
let osc = 0;
let oscmode = 0;
let num = 8;

function setupcb (pgm){ 
	for(let i = 0; i < pgm.uniforms.points.length; i++){
		pgm.uniforms.points[i] = Math.random()*1.8-0.9;
	}
}

function rendercb (pgm){
	preturb_sinkXY(pgm.uniforms.points, amount, coef*_sink-(osc*0.0004));
	pgm.uniforms.radius = rad;
	cnt += hz;
	coef = (osc-oscmode)*Math.cos(cnt) + Math.abs(1.-osc) + oscmode;
	if(cnt >= 6.831){
		cnt -= 6.831;
		if(osc*oscmode)
			reset(pgm.uniforms.points);
	}
}


function preturb_sinkXY(floats, amp, sink){
	for(let i = 0; i < floats.length; i++){
		let o = Math.atan2(floats[i]+0, floats[i+1]+0);
		floats[i] += Math.sin(o)*sink;
		floats[i+1] += Math.cos(o)*sink;
		floats[i] += Math.random()*amp*2 - amp;
		floats[++i] += Math.random()*amp*2 - amp;
	}
}

function preturbXY (floats, amp){
	for(let i = 0; i < floats.length; i++){	
		floats[i] += Math.random()*amp*2 - amp;
		floats[++i] += Math.random()*amp*2 - amp;
	}
}

function sinkXY (floats, amp){
	for(let i = 0; i < floats.length; i++){	
		let o = Math.atan2(floats[i]+0, floats[i+1]+0);
		floats[i] -= Math.sin(o)*amp;
		floats[++i] -= Math.cos(o)*amp;
	}
}

function reset(points){
	for(let i = 0; i < points.length; i++){
		points[i] = Math.random()*1.8 - 0.9;
	}
}

const gui = {
	name: 'brownian',
	open : false,
	switch : true,
	fields: [
		{
			amt: amount,
			min: 0.0001,
			max: 0.02,
			step: 0.0001,
			onChange: (val)=>{amount = val;}
		},
		{
			radius: rad,
			min: 1,
			max: 14,
			step: 0.1,
			onChange: (val)=>{rad = val;}
		},
		{
			num: num,
			min: 8,
			max: 32,
			step: 1,
			onChange: (val)=>{prog.uniforms.num = val;}
		},
		{
			sink: _sink,
			min: -1,
			max: 1,
			step: 0.0001,
			onChange: (val)=>{_sink = val*0.01;}			
		},
		// {
		// 	osc: false,
		// 	onChange: (val)=>{osc = val ? 1 : 0;}
		// },
		{
			oscmode: oscmode,
			min: 0,
			max: 2,
			step: 1,
			onChange: (val)=>{osc = +(val > 0); oscmode = Math.max(0,val-1);}
		},
		{
			period: interval,
			min: 1,
			max: 10,
			step: 0.01,
			onChange: (val)=>{ interval = val; hz = 2.*0.0167/interval; }
		},
		{
			reset : ()=>{ reset(prog.uniforms.points); }
		}
	]

};

const prog = {

	fs : fshader,
	setupcb : setupcb,
	rendercb : rendercb,
	uniforms : {
		points : xypoints,
		radius: rad,
		num: num
	},
	gui : gui,
	// on: false,
	// clearcolor: [0.2, 0.8, 0.0, 1],

};

export default prog;