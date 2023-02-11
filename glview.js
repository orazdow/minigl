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
    #define glf gl_FragCoord

    void main() {
        // vec3 col = vcolor + .5*(cos(time+(glf.x+glf.y)/20.)*.2+.2);
        fragColor = vec4(vcolor, 1.);
    }
`;

const def_prog = {
    arrays: {
        position: {
            components: 3,
            data: [-1,-1,0, 1,-1,0,  -1,1,0,  1,1,0]
        },
        color: {
            components: 3,
            data: [0,1,0, 0,0,1, 0,0,1, 1,0,0]
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

    constructor(canvas, pgms, res, limitfps, gui, guiobj){
        this.pgms = (pgms instanceof Array)? pgms : [pgms];
        this.prog = this.pgms[0];
        this.gl = canvas.getContext("webgl2", {premultipliedAlpha: false, antialias: true});
        if(!this.gl){console.log('no gl context'); return;}
        this.res = res || [500, 500];
        initCanvas(canvas, this.res);
        this.render = this.render.bind(this);
        this.fps = this.fps.bind(this);
        this.req = null;
        this.loop = false;
        this.limit = limitfps;
        this.mouse = [0,0];
        window.glview = this;
        canvas.onmousemove = (e)=>{
            this.mouse[0] = e.offsetX/this.res[0];
            this.mouse[1] = 1.-e.offsetY/this.res[1];
        }
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.viewport(0, 0, this.res[0], this.res[1]);
        if(!this.init(this.gl, this.pgms)) this.start = this.frame = ()=>{};
        if(gui) initGui(gui, this, guiobj);
    }

    start(){
        this.gl.viewport(0, 0, this.res[0], this.res[1]);
        this.gl.clearColor(...this.prog.clearcolor);
        this.loop = true;
        const f = (time)=>{
            this.render(time); 
            this.req = requestAnimationFrame(f);
        }; 
        if(this.limit) this.fps(30); else f(0);
    }

    stop(){
        this.loop = false;
        cancelAnimationFrame(this.req);
    }

    switchProgram(idx){      
        if(this.pgms[idx]){
            if(this.prog.gui) this.prog._gui.hide();
            this.prog = this.pgms[idx];
            this.frame();
            if(this.prog.gui) this.prog._gui.show();
        }
    }

    frame(time=0){
        if(!this.loop) this.render(time);
    }

    render(time){
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.prog.uniforms.time = time*.01;
        this.prog.uniforms.mouse = this.mouse;
        enableAttributes(this.gl, this.prog);
        this.prog.rendercb(this.prog);
        setUniforms(this.gl, this.prog);
        drawObj(this.gl, this.prog);
        for(let p of this.prog.chain) if(p.on){
            p.uniforms.time = time*.01;
            p.uniforms.mouse = this.mouse;
            enableAttributes(this.gl, p);
            p.rendercb(p);
            setUniforms(this.gl, p);
            drawObj(this.gl, p);            
        }
    }

    fps(ms){
        let last = performance.now();
        const _loop = (time)=>{
            this.req = requestAnimationFrame(_loop);
            if(time-last > ms){ 
                last = time;
                this.render(time);
            }
        }; _loop(0);
    }

    init(gl, pgms){
        for(let pgm of pgms){
            merge(pgm, def_prog);
            pgm.uniforms.resolution = this.res;
            if(!createShaderProgram(gl, pgm)) return null; 
            pgm.setupcb(pgm);
            createBuffers(gl, pgm);
            for(let p of pgm.chain||[]){
                merge(p, {...def_prog, count: pgm.count});
                p.uniforms.resolution = this.res;
                if(!createShaderProgram(gl, p)) return null;
                p.setupcb(p);
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

function initGui(gui, ctl, mainobj){
    gui.__closeButton.style.visibility = "hidden";
    if(ctl.pgms.length > 1)
        gui.add({pgm: 0}, 'pgm', 0, ctl.pgms.length-1, 1).onChange((val)=>{
            ctl.switchProgram(val);   
        });
    if(mainobj){ addGuiObj(gui, mainobj, ctl); mainobj.ctl = ctl;}
    for(let p of ctl.pgms){
        if(p.gui) initSubGui(gui, p, ctl, p!==ctl.prog);
        for(let _p of p.chain || [])
            if(_p.gui) initSubGui(gui, _p, ctl);
    }
}

function initSubGui(gui, p, ctl, hide){
    p._gui = gui.addFolder(p.gui.name);
    p.ctl = ctl;
    if(hide) p._gui.hide();
    if(p.gui.open && p.on) p._gui.open();         
    addGuiObj(p._gui, p.gui, ctl); 
    p._gui.title = p._gui.__ul.firstChild;
    p._gui.title.style.color = p.on ? "springgreen" : "white";
    if(p.gui.switch){
       let _p = p._gui.add({'' : p.on}, '', p.on);
           _p.onChange((val)=>{
            p.on = val;
            p._gui.title.style.color = p.on ? "springgreen" : "white";
            ctl.frame();
        });
    }
}

function addGuiObj(guiTarget, guiObj, ctl){
    let i = 0;
    for(let o of guiObj.fields||[]){
        let f;
        if(f = o.onChange){ delete o.onChange; }
        let params = [o, Object.keys(o)[0], ...Object.values(o).slice(1)];
        let g = guiTarget.add(...params);
        if(f){
            if(guiObj.updateFrame)
                g.onChange((v)=>{f(v); ctl.frame();}); 
            else g.onChange(f);
        }
        guiObj.fields[i++].ref = g;
    }       
}

export default Glview;