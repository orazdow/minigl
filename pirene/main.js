import * as mgl from "./minigl.js";
import * as mat4 from "./lib/glmat/mat4.js";
import * as shd from "./shaders.js";
import initGui from "./lib/gui.js";
import {loadObj, getTangents, getDim} from "./lib/loader.js";
import {solids, polyhedra, models} from './model.js';
import pirene from './pirene.js';

const {PI, cos, sin, min, max} = Math;
const eye = {pos: [0.5, 2.2, 5.5], target: [0, .5, -.5]};        
var gl, req, res = [800, 800], mouse = [0, 0];
var r = 0.4, cam = false;

const pointlight = {
    pos: [0, .6, 2.7],
    pmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    vmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
}

function moveLightMat(light) {
    mat4.lookAt(light.vmat, light.pos, [0,0,0],[0, 1, 0]);
}

function setView(vmat, v3Pos, v3Target){
    mat4.lookAt(vmat, v3Pos, v3Target, [0, 1, 0]);
}

// load model data
function mdata(model, position, normal, texcoord, tangent) {
    if(position) for (let t of model.indices.v)
        for (let i of t) position.push(...model.vertices.v[i]);
    if(normal) for (let t of model.indices.vn)
        for (let i of t) normal.push(...model.vertices.vn[i]);
    if(texcoord) for (let t of model.indices.vt)
        for (let i of t) texcoord.push(...model.vertices.vt[i]);
    if(tangent) for(let t of model.indices.tangent)
        for (let i of t) tangent.push(...model.vertices.tangent[i]);

}

const wall = {
    arrays: {
        position: {
            components: 4,
            data: [],
        },
        normal: {
            components: 4,
            data: [],
        },
        texcoord: {
            components: 2,
            data: [],
        },
        tangent: {
            components: 4,
            data: []
        }
    },
    light : pointlight,
    pos: [0,0,0],
    uniforms: {
        scale: 1,
        mmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        rmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        useNorm: 1
    },
    textures: [
    ],
    setup: (gl, pgm)=>{
        let model = loadObj(pirene, 0.6);
        getTangents(model);
        mdata(model,
              pgm.arrays.position.data,
              pgm.arrays.normal.data,
              pgm.arrays.texcoord.data,
              pgm.arrays.tangent.data);
        // pgm.pos[1] -= model.dim.ymin;
        mat4.fromTranslation(pgm.uniforms.mmat, pgm.pos);
    },
};

const poly = {
    arrays: {
        position: {
            components: 4,
            data: [],
        },
        normal: {
            components: 4,
            data: [],
        },
        texcoord: {
            components: 2,
            data: [],
        },
        tangent: {
            components: 4,
            data: []
        }
    },
    light : pointlight,
    pos: [0, .5, .9],
    uniforms: {
        scale: 1,
        mmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        rmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        useNorm: 0
    },
    textures: [
    ],
    setup: (gl, pgm)=>{
        let model = loadObj(polyhedra.triakisicosahedron, 0.3, true, true);
        getTangents(model);
        mdata(model,
              pgm.arrays.position.data,
              pgm.arrays.normal.data,
              pgm.arrays.texcoord.data,
              pgm.arrays.tangent.data);
        mat4.fromTranslation(pgm.uniforms.mmat, pgm.pos);
    },
    render: orbit
};

function orbit(gl, pgm) {
    let x = pgm.uniforms.mouse[0];
    let y = pgm.uniforms.mouse[1];
    mat4.rotate(pgm.uniforms.rmat, pgm.uniforms.rmat, r * 0.15 * Math.hypot(x, y), [-y, -x, 0]);
}

const sky = {
    arrays: {
        position: {
            components: 4,
            data: [-1,-1,1,1, 1,1,1,1, -1,1,1,1, -1,-1,1,1, 1,-1,1,1, 1,1,1,1],
        },
    },
    shaders: [{
        vs: shd.sky_vs,
        fs: shd.sky_fs,   
    }],
    shader: undefined,
    textures: [{
            src:[
                'cubemap/2/px.png',
                'cubemap/2/nx.png',
                'cubemap/2/py.png',
                'cubemap/2/ny.png',
                'cubemap/2/pz.png',
                'cubemap/2/nz.png'
            ],
            type: 'TEXTURE_CUBE_MAP',
            uniform: 'cubemap',
            index: 2
        }]
};

// ground plane
const pgm = {
    arrays: {
        position: {
            components: 4,
            data: [-1,0,1,1, 1,0,-1,1, -1,0,-1,1, -1,0,1,1, 1,0,1,1, 1,0,-1,1],
        },

        normal: {
            components: 4,
            data: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
        },
        texcoord: {
            components: 2,
            data: [0,0, 1,0, 0,1, 0,1, 1,0, 1,1],
        },
        tangent: {
            components: 4,
            data: [1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1]
        }
    },
    light : pointlight,
    shaders: [
        {
            vs: shd.light_vs,
            fs: shd.light_fs,
        },
        {
            vs: shd.depth_vs,
            fs: shd.depth_fs,
        },
    ],
    shader: undefined,
    uniforms: {
        scale: 3,
        bkgd: 0,
        useTex: 0,
        useNorm: 0,
        depth_tex: 0,
        cubemap: 2,
        normal_map: 1,
        mmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        pmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        vmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        rmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],       
        lpmat: pointlight.pmat,
        lvmat: pointlight.vmat,
        viewpos: eye.pos,
        lighta: {
            pos: pointlight.pos,
            dir: [0,0,0],
            col: [1, .7, 0],
            pow: 18,
            spec: .9,
            diff: .6,
            am: 0.17,
            atten: .16
        },
    },
    textures: [
        {
            uniform: 'normal_map',
            index: 1,
            src: './pebbles.png'
        }
    ],
    pos: [0,0,0],
    hsv: [0.12,1,1],
    setup: (gl, pgm) => {
        mat4.perspective(pgm.uniforms.pmat, 1, pgm.res[0] / pgm.res[1], 0.05, 20);
        setView(pgm.uniforms.vmat, eye.pos, eye.target, [0, 1, 0]);
        mat4.fromTranslation(pgm.uniforms.mmat, pgm.pos);
        mat4.perspective(pgm.light.pmat, 1.1, pgm.res[0]/pgm.res[1], .1, 22); // depth
        moveLightMat(pgm.light);
    },
    render: (gl, pgm)=>{
        if(cam){
            eye.pos[0] = -mouse[0]*4;
            eye.pos[1] = mouse[1]*4;
            setView(pgm.uniforms.vmat, eye.pos, eye.target);
        }
    },
    sub: [wall, poly, sky],
    drawMode: "TRIANGLES",
    targets: {
        depth: true,
        texture: null,
        renderbuffer: null,
    },
};


// ---
const gui = {
  name: 'ctl',
  open: 1,
  fields: [
        {
        name: 'light',
        open: true,
        fields: [
            {
                x: [pgm.light.pos[0], -2, 2, .01],
                onChange: v => {pgm.light.pos[0] = v; moveLightMat(pgm.light);}
            },
            {
                y: [pgm.light.pos[1], -1, 3, .01],
                onChange: v => {pgm.light.pos[1] = v; moveLightMat(pgm.light);}
            },
            {
                z: [pgm.light.pos[2], -2, 5, .01],
                onChange: v => {pgm.light.pos[2] = v; moveLightMat(pgm.light);}
            },
            {
                pow: [pgm.uniforms.lighta.pow, 1, 40, .01],
                onChange: (v)=>{pgm.uniforms.lighta.pow = v;}
            },
            {
                spec: [pgm.uniforms.lighta.spec, 0, 1, .01],
                onChange: (v)=>{pgm.uniforms.lighta.spec = v;}
            },
            {
                diff: [pgm.uniforms.lighta.diff, 0, 1, .01],
                onChange: (v)=>{pgm.uniforms.lighta.diff = v;}
            },
            {
                am: [pgm.uniforms.lighta.am, 0, 1, .001],
                onChange: v =>{pgm.uniforms.lighta.am = v;}
            },
            {
                atten: [pgm.uniforms.lighta.atten, 0, 1, .01],
                onChange: (v)=>{pgm.uniforms.lighta.atten = v;}
            },
            {
                hue: [pgm.hsv[0], 0, 1, .001],
                onChange: (v)=>{
                    pgm.hsv[0] = v;
                    pgm.uniforms.lighta.col = hsv2rgb(...pgm.hsv);
                },
            },
        ]
    },
    {
        obj_z: [pgm.sub[1].pos[2], -2, 3, .01],
        onChange: (v)=>{
            pgm.sub[1].pos[2] = v;
             mat4.fromTranslation(pgm.sub[1].uniforms.mmat, pgm.sub[1].pos);
        }
    },
    {
        cam_x: [eye.pos[0], -6, 6, 0.1],
        onChange: (v)=>{
            eye.pos[0] = v;
            setView(pgm.uniforms.vmat, eye.pos, eye.target, [0, 1, 0]);
        }
    },
    {
        cam_y: [eye.pos[1], -4, 8, 0.1],
        onChange: (v)=>{
            eye.pos[1] = v;
            setView(pgm.uniforms.vmat, eye.pos, eye.target, [0, 1, 0]);
        }
    },
    {
        cam_z: [eye.pos[2], -2, 10, 0.1],
        onChange: (v)=>{
            eye.pos[2] = v;
             setView(pgm.uniforms.vmat, eye.pos, eye.target, [0, 1, 0]);
        }
    },
    ],

};

// ---
function draw(gl, pgm, time){
    pgm.uniforms.time = time * 0.001;
    pgm.uniforms.mouse = mouse;
    let p = pgm.sub[0]
    let p2 = pgm.sub[1]
    let p3 = pgm.sub[2]

    gl.bindFramebuffer(gl.FRAMEBUFFER, pgm.targets.depth.framebuffer);
    gl.viewport(0, 0, mgl.depth_dim, mgl.depth_dim);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mgl.useProgram(gl, pgm, 1);

    mgl.enableAttributes(gl, pgm);
    mgl.setUniforms(gl, pgm);
    pgm.render(gl, pgm);
    // mgl.drawObj(gl, pgm);

    mgl.enableAttributes(gl, p);
    // p.render(gl, p);
    mgl.setUniforms(gl, p);
    mgl.drawObj(gl, p);

    mgl.enableAttributes(gl, p2);
    p2.render(gl, p2);
    mgl.setUniforms(gl, p2);
    mgl.drawObj(gl, p2);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, res[0], res[1]);
    // gl.bindTexture(gl.TEXTURE_2D, pgm.targets.depth.texture);

    mgl.useProgram(gl, p3);
    mgl.enableAttributes(gl, p3);
    // p.render(gl, p);
    mgl.setUniforms(gl, p3);
    mgl.drawObj(gl, p3);

    mgl.useProgram(gl, pgm, 0);

    mgl.enableAttributes(gl, pgm);
    mgl.setUniforms(gl, pgm);
    // pgm.render(gl, pgm);
    // mgl.drawObj(gl, pgm);

    mgl.enableAttributes(gl, p);
    // p.render(gl, p);
    mgl.setUniforms(gl, p);
    mgl.drawObj(gl, p);

    mgl.enableAttributes(gl, p2);
    // p2.render(gl, p2);
    mgl.setUniforms(gl, p2);
    mgl.drawObj(gl, p2);

}

// ---
function init(canvas, w, h, pgm, render, gui) {
    canvas.width = res[0];
    canvas.height = res[1];
    canvas.style.width = res[0] + "px";
    canvas.style.height = res[1] + "px";
    canvas.onmousemove = (e) => {
        mouse[0] = (e.offsetX/res[0])*2 - 1;
        mouse[1] = (e.offsetY/res[1])*2 - 1;
    };
    initGui(gui);
    gl = canvas.getContext("webgl2", { antialias: true });
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK)
    gl.frontFace(gl.CCW)
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.viewport(0, 0, w, h);
    pgm.res = [w, h];
    pgm.uniforms.resolution = pgm.res;
    pgm.uniforms.mouse = mouse;
    pgm.uniforms.time = 0;
    pgm.setup ??= () => {};
    pgm.render ??= () => {};
    pgm.setup(gl, pgm);
    mgl.createShaderProgram(gl, pgm);
    mgl.setBuffers(gl, pgm);
    mgl.loadTextures(gl, pgm);
    mgl.setTargets(gl, pgm);
    mgl.setSubPgms(gl, pgm);
    const f = (time) => {
        render(gl, pgm, time);
        req = requestAnimationFrame(f);
    };
    f();
}

function hsv2rgb(h,s,v){
    let f= (n,k=(n+h*6)%6) => v - v*s*Math.max( Math.min(k,4-k,1), 0);
    return [f(5),f(3),f(1)];
}

window.onkeypress = (e)=>{
    if(e.key === 'c') cam = !cam;
}

init(document.querySelector("canvas"), ...res, pgm, draw, gui);
const _t = document.createElement("p");
_t.innerHTML = "press c to toggle camera";
document.body.appendChild(_t);
