import * as mgl from './minigl.js';

const def_vs =/*glsl*/`#version 300 es
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

const def_fs = /*glsl*/`#version 300 es
    precision mediump float;
    in vec3 vcolor;
    in vec2 vtex;
    out vec4 fragColor;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;

    void main(){
        vec2 uv = (2.*gl_FragCoord.xy-resolution)/resolution.y;
        vec3 c = uv.xyx*cos(time+vec3(0,1,3))*.5+.5;
        fragColor = vec4(c, 1);
    }
`;

const def_prog = {
    arrays: {
        position: {
            components: 2,
            data: [-1,-1, 1,-1,  -1,1,  1,1]
        },
        texcoord: {
            components: 2,
            data: [0,0, 1,0, 0,1, 1,1]
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
    res: [500,500],
    drawMode: 'TRIANGLE_STRIP',
    textures: [],
    targets: {
        texture: null,
        renderbuffer: null
    },
    draw: null,
    clear: true,
    rendercb: ()=>{},
    setupcb: ()=>{},
    chain: [],
    shaderProgram: null,
    on: true
}

class Glview{

    constructor(canvas, pgms, res, fps, gui, guiobj){
        this.pgms = (pgms instanceof Array)? pgms : [pgms];
        this.prog = this.pgms[0];
        this.gl = canvas.getContext("webgl2", {premultipliedAlpha: true, antialias: true});
        if(!this.gl){console.log('no gl context'); return;}
        this.res = res || [500, 500];
        initCanvas(canvas, this.res);
        this.render = this.render.bind(this);
        this.fpsloop = this.fpsloop.bind(this);
        this.req = null;
        this.loop = false;
        this.fps = fps;
        this.mouse = [0,0];
        canvas.onmousemove = (e)=>{
            this.mouse[0] = e.offsetX/this.res[0];
            this.mouse[1] = 1.-e.offsetY/this.res[1];
        }
        def_prog.ctl = this;
        def_prog.res = this.res;
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.viewport(0, 0, this.res[0], this.res[1]);
        if(!this.init(this.gl, this.pgms)){this.start = this.frame = ()=>{}; return;}
        if(gui) initGui(gui, this, guiobj);
        this.gl.clearColor(...this.prog.clearcolor);
        window.ctl = this;
    }

    start(){
        this.gl.viewport(0, 0, this.res[0], this.res[1]);
        this.gl.clearColor(...this.prog.clearcolor);
        if(this.loop) return;
        this.loop = true;
        const f = (time)=>{
            this.render(time); 
            this.req = requestAnimationFrame(f);
        }; 
        if(this.fps) this.fpsloop(1000/this.fps); else f(0);
    }

    stop(){
        this.loop = false;
        cancelAnimationFrame(this.req);
    }

    switchProgram(idx){      
        if(this.pgms[idx]){
            if(this.prog._gui) this.prog._gui.hide();
            this.prog = this.pgms[idx];
            activePgm(this.gl, this.prog);
            this.gl.clearColor(...this.prog.clearcolor);
            this.frame();
            if(this.prog._gui) this.prog._gui.show();
        }
    }

    frame(time=0){
        if(!this.loop) this.render(time);
    }

    render(time){
        this.prog.uniforms.time = time*.001;
        this.prog.uniforms.mouse = this.mouse;
        mgl.enableAttributes(this.gl, this.prog);
        this.prog.rendercb(this.prog);
        mgl.setUniforms(this.gl, this.prog);
        this.prog.draw(this.gl, this.prog);
        for(let p of this.prog.chain) if(p.on){
            p.uniforms.time = time*.01;
            p.uniforms.mouse = this.mouse;
            mgl.enableAttributes(this.gl, p);
            p.rendercb(p);
            mgl.setUniforms(this.gl, p);
            p.draw(this.gl, p);          
        }
    }

    fpsloop(ms){
        let last = performance.now();
        const _loop = (time)=>{
            this.req = requestAnimationFrame(_loop);
            let delta = time-last;
            if(delta > ms){
                last = time - (delta%ms);
                this.render(time);
            }
        }; _loop(0);
    }

    init(gl, pgms){
        for(let pgm of pgms){
            merge(pgm, def_prog);
            pgm.uniforms.resolution = this.res;
            pgm.uniforms.time = 0;
            if(!mgl.createShaderProgram(gl, pgm)) return null; 
            pgm.setupcb(pgm);
            setTargets(gl, pgm);
            setDraw(gl, pgm);
            mgl.setBuffers(gl, pgm);
            mgl.loadTextures(gl, pgm);
            for(let p of pgm.chain||[]){
                merge(p, {...def_prog, count: pgm.count, clear: false});
                p.uniforms.resolution = this.res;
                p.uniforms.time = 0;
                if(!mgl.createShaderProgram(gl, p)) return null;
                p.setupcb(p);
                setDraw(gl, p);
                mgl.setBuffers(gl, p);
                mgl.loadTextures(gl, pgm);
            }
        } 
        activePgm(gl, pgms[0]);
        return 1;
    }
};

function activePgm(gl, pgm){
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    let t = pgm?.textures[0]?.texture;
    if(t) gl.bindTexture(gl.TEXTURE_2D, t);
}

function merge(dest, template){ 
    for(let prop in template) 
        if(dest[prop] == null) dest[prop] = template[prop];
}

function initCanvas(canvas, res){
    canvas.width = res[0];
    canvas.height = res[1];
    canvas.style.width = res[0]+'px';
    canvas.style.height = res[1]+'px';    
}

function setDraw(gl, pgm){ 
    // if(pgm.draw) return;
    // if(pgm.targets.texture && pgm.targets.renderbuffer)
    //     pgm.draw = backBufferDraw;
    // else if(pgm.targets.texture)
    //     pgm.draw = textureDraw;
    // else pgm.draw = (gl, pgm)=>{
    //     gl.clear(gl.COLOR_BUFFER_BIT);
    //     mgl.drawObj(gl, pgm);       
    // };
    pgm.draw = pgm.clear ? (gl, pgm)=>{
        gl.clear(gl.COLOR_BUFFER_BIT);
        mgl.drawObj(gl, pgm);       
    } : (gl, pgm)=>{mgl.drawObj(gl, pgm)};
}

function setTargets(gl, pgm){
    if(pgm.targets.texture)
        pgm.targets.texture = mgl.textureBufferTarget(gl, ...pgm.res);
    if(pgm.targets.renderbuffer)
        pgm.targets.renderbuffer = mgl.renderBufferTarget(gl, ...pgm.res);
}

function textureDraw(gl, pgm){
    gl.viewport(0, 0, ...pgm.res);
    gl.bindTexture(gl.TEXTURE_2D, pgm.targets.texture.texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pgm.targets.texture.framebuffer);
    mgl.drawObj(gl, pgm);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);  
    gl.clear(gl.COLOR_BUFFER_BIT);
    mgl.drawObj(gl, pgm);
}

function backBufferDraw(gl, pgm){
    gl.viewport(0, 0, ...pgm.res);  
    gl.bindFramebuffer(gl.FRAMEBUFFER, pgm.targets.renderbuffer.framebuffer);
    mgl.drawObj(gl, pgm);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT);
    mgl.drawObj(gl, pgm);

    gl.bindTexture(gl.TEXTURE_2D, pgm.targets.texture.texture);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, pgm.targets.renderbuffer.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, pgm.targets.texture.framebuffer);
    gl.blitFramebuffer(0,0, ...pgm.res, 0,0, ...pgm.res, gl.COLOR_BUFFER_BIT, gl.NEAREST); 
}

function initGui(gui, ctl, mainobj){
    gui.__closeButton.style.visibility = "hidden";
    if(ctl.pgms.length > 1)
        gui.add({pgm: 0}, 'pgm', 0, ctl.pgms.length-1, 1).onChange((val)=>{
            ctl.switchProgram(val);   
        });
    if(mainobj){ 
        if(mainobj.name) guiSubFolder(gui, mainobj, ctl);
        else addGuiObj(gui, mainobj, ctl); 
    }
    for(let p of ctl.pgms){
        if(p.gui) initSubGui(gui, p, ctl, p!==ctl.prog);
        for(let _p of p.chain || [])
            if(_p.gui) initSubGui(gui, _p, ctl);
    }
}

function initSubGui(gui, p, ctl, hide){
    p._gui = gui.addFolder(p.gui.name||'');
    if(hide) p._gui.hide();
    if(p.gui.open && p.on) p._gui.open(); 
    p.ctl = ctl;        
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

function guiSubFolder(gui, obj, ctl){
    let g = gui.addFolder(obj.name||'');
    if(obj.open) g.open();
    addGuiObj(g, obj, ctl);
    g.title = g.__ul.firstChild;
    g.title.style.color = "springgreen";
}

function addGuiObj(gui, obj, ctl){
    let i = 0;
    for(let o of obj.fields||[]){
        if(o.fields){guiSubFolder(gui, o, ctl); continue;}
        let f;
        if(f = o.onChange) delete o.onChange;
        o = getArrayParams(o);
        let params = [o, Object.keys(o)[0], ...Object.values(o).slice(1)];
        let g = gui.add(...params);
        if(f){
            if(obj.updateFrame) g.onChange((v)=>{f(v); ctl.frame();}); 
            else g.onChange(f);
        }
        obj.fields[i++].ref = g;
    }   obj.ctl = ctl;    
}

function getArrayParams(o){
    let e = Object.entries(o)[0];
    if(e[1] instanceof Array){
        o[e[0]]= e[1][0];
        o.min = e[1][1];
        o.max = e[1][2];
        o.step = e[1][3];
    }return o;
}

export default Glview;