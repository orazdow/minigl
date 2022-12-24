import {createShaderProgram, createBuffers, enableAttributes, setUniforms, drawObj} from './minigl.js';

const def_vs =/*glsl*/`#version 300 es

	in vec3 position;
	in vec3 color;
	out vec3 vcolor;
    
    void main() {
    	vcolor = color;
        gl_Position = vec4(position, 1.);
    }
`;

const def_fs = /*glsl*/`#version 300 es
    precision mediump float;
    in vec3 vcolor;
    out vec4 fragColor;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    uniform float a;
    #define g gl_FragCoord

    void main() {
    	vec3 col = vcolor + .5*a*(cos(time+(g.x+g.y)/20.)*.2+.2);
        fragColor = vec4(col, 1.);
    }
`;

const def_prog = {
	arrays: {
		position: {
			components: 3,
			data: [-1,-1,0, 1,-1,0,  -1,1,0,  1,1,0]
		}
	},
    clearcolor: [0,0,0,0],
	uniforms: {
        resolution: [500,500],
        mouse: [0,0],
        time: 0
    },
	vs: def_vs,
	fs: def_fs,
	drawMode: 'TRIANGLE_STRIP',
    textures : null,
    rendercb : ()=>{},
    setupcb : ()=>{},
    chain : [],
	shaderProgram: null,
	on: true
}

class Glview{

    constructor(canvas, pgms, res, gui){
    	this.pgms = (pgms instanceof Array)? pgms : [pgms];
        this.prog = this.pgms[0];
        this.gl = canvas.getContext("webgl2", {premultipliedAlpha: false, antialias: true});
        if(!this.gl){console.log('no gl context'); return;}
        this.res = res || [500, 500];
        initCanvas(canvas, this.res);
        this.render = this.render.bind(this);
        this.req = null;
        this.loop = false;
        this.mouse = [0,0];
        this.rect = canvas.getBoundingClientRect();
        canvas.onmousemove = (e)=>{
        	this.mouse[0] = (e.clientX-this.rect.x)/this.res[0];
        	this.mouse[1] = (e.clientY-this.rect.y)/this.res[1];
        }
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.viewport(0, 0, this.res[0], this.res[1]);
        if(!this.init(this.gl, this.pgms)) this.exit = true;
    }

    start(){
        if(this.exit) return;
        this.gl.viewport(0, 0, this.res[0], this.res[1]);
        this.gl.clearColor(...this.prog.clearcolor);
        this.loop = true;
    	this.req = requestAnimationFrame(this.render);
    }

    stop(){
        this.loop = false;
        cancelAnimationFrame(this.req);
    }

    frame(){
        if(!this.loop) this.render(0);
    }

    render(time){
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.prog.uniforms.time = time*.01;
        this.prog.uniforms.mouse = this.mouse;
		enableAttributes(this.gl, this.prog);
		setUniforms(this.gl, this.prog);
		drawObj(this.gl, this.prog);
		for(let p of this.prog.chain) if(p.on){
            p.uniforms.time = time*.01;
            p.uniforms.mouse = this.mouse;
			enableAttributes(this.gl, p);
			setUniforms(this.gl, p);
			drawObj(this.gl, p);			
		}
        if(this.loop) this.req = requestAnimationFrame(this.render);	
    }

    init(gl, pgms){
    	for(let pgm of pgms){
    		merge(pgm, def_prog);
            pgm.uniforms.resolution = this.res;
    		if(!createShaderProgram(gl, pgm)) return null; 
    		createBuffers(gl, pgm);
    		for(let p of pgm.chain||[]){
    			merge(p, {...def_prog, count: pgm.count});
                p.uniforms.resolution = this.res;
	    		if(!createShaderProgram(gl, p)) return null;
    			createBuffers(gl, p);
    		}
    	} return 1;
    }
}

function initCanvas(canvas, res){
    canvas.width = res[0];
    canvas.height = res[1];
    canvas.style.width = res[0]+'px';
    canvas.style.height = res[1]+'px';    
}

function merge(dest, template){
    for(let prop in template) 
    	if(dest[prop] == null) dest[prop] = template[prop];
}

export default Glview;