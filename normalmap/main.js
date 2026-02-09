import * as mgl from "./minigl.js";
import { loadObj, getTangents } from "./lib/loader.js";
import * as mat4 from "./lib/glmat/mat4.js";
import * as shd from "./shaders.js";
import initGui from "./lib/gui.js";
import {solids, polyhedra, models} from './model.js';

const {PI, cos, sin, min, max} = Math;
var gl,req, res = [600, 600], mouse = [0, 0];
var r = 0.333;
const eye = {
    pos:  [0, 0, 3],
    target: [0, 0, -.5]
};          

const pointlight = {
    s_trim: .2,
    pos: [0, 0, 2],
    pmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    vmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
}

function moveLightMat(light) {
    const p = light.pos;
    mat4.lookAt(light.vmat,[p[0], p[1], p[2]+light.s_trim],[0, 0, 0],[0, 1, 0]);
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

// --- model
const modelp = {
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
    z: 0.7,
    uniforms: {
        mmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        rmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        cow_tex: 2,
        useTex: 1,
        useNorm: 0
    },
    textures: [
        {
            uniform: 'cow_tex',
            index: 2,
            src: './cow.png'
        },
        {
            uniform: 'normal_map',
            index: 3,
            src: './pebbles.png'
        }
    ],
    setup: (gl, pgm)=>{
        // let model = loadObj(tetra, .5, true);
        // let model = loadObj(solids.icosahedron, 0.28, true, true);
        // let model = loadObj(models.salamander, 0.1, true, true);
        let model = loadObj(models.cow, 0.1, true, true);
        getTangents(model)
        mdata(model,
              pgm.arrays.position.data,
              pgm.arrays.normal.data,
              pgm.arrays.texcoord.data,
              pgm.arrays.tangent.data);
        mat4.fromTranslation(pgm.uniforms.mmat, [0,0,pgm.z]);
        mgl.loadTextures(gl, pgm)
    },
    render: orbit
};

// --- bkgd plane
const pgm = {
    arrays: {
        position: {
            components: 4,
            data: [-1,-1,0,1, 1,-1,0,1, -1,1,0,1, -1,1,0,1, 1,-1,0,1, 1,1,0,1],
        },

        normal: {
            components: 4,
            data: [0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1],
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
        scale: 1.5,
        useTex: 0,
        useNorm: 1,
        depth_tex: 0,
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
            col: [.7,.0,.5],
            pow: 15,
            spec: .9,
            diff: .7,
            dz: 0,
            am: 0,
            atten: .5
        },
    },
    ra: 0,
    rv: [1,0,0],
    z: -1,
    a_hsv: [0,1,1],
    setup: (gl, pgm) => {
        mat4.fromTranslation(pgm.uniforms.mmat, [0, 0, -1]);
        mat4.perspective(pgm.uniforms.pmat, 0.8, pgm.res[0] / pgm.res[1], 0.05, 20);
        setView(pgm.uniforms.vmat, eye.pos, eye.target, [0, 1, 0]);
        // depth
        mat4.perspective(pgm.light.pmat, 1, pgm.res[0]/pgm.res[1], .14, 8);
        moveLightMat(pgm.light);
        console.log(pgm)
    },
    sub: [modelp],
    drawMode: "TRIANGLES",
    textures: [],
    targets: {
        depth: true,
        texture: null,
        renderbuffer: null,
    },
};


function orbit(gl, pgm) {
    let x = pgm.uniforms.mouse[0] - 0.5;
    let y = pgm.uniforms.mouse[1] - 0.5;
    mat4.rotate(pgm.uniforms.rmat, pgm.uniforms.rmat, r * 0.1 * Math.hypot(x, y), [y, -x, 0]);
}

// ---
const gui = {
  name: 'ctl',
  open: 1,
  fields: [
    {
        name: 'plane',
        open: false,
        fields: [
            {
                scale: [pgm.uniforms.scale, 1, 3, .01],
                onChange:(v)=>{
                    pgm.uniforms.scale = v;
                }
            },
            {
                z: [-pgm.z, -1, 2, .01],
                onChange: (v)=>{
                    pgm.z = -v;
                    mat4.fromTranslation(pgm.uniforms.mmat, [0,0,pgm.z]);
                }
            },
            {
                a: [pgm.ra, 0, PI, .01],
                    onChange: (v)=>{
                        pgm.ra = v;
                        mat4.fromRotation(pgm.uniforms.rmat, pgm.ra, pgm.rv);
                    }
            },
            {
                rx: [pgm.rv[0], -1, 1, .01],
                    onChange: (v)=>{
                        pgm.rv[0] = v;
                        mat4.fromRotation(pgm.uniforms.rmat, pgm.ra, pgm.rv);
                }
            },
            {
                ry: [pgm.rv[1], -1, 1, .01],
                    onChange: (v)=>{
                        pgm.rv[1] = v;
                        mat4.fromRotation(pgm.uniforms.rmat, pgm.ra, pgm.rv);
                    }
                },
            {
                rz: [pgm.rv[2], -1, 1, .01],
                    onChange: (v)=>{
                        pgm.rv[2] = v;
                        mat4.fromRotation(pgm.uniforms.rmat, pgm.ra, pgm.rv);
                    }
            },
        ]
    },{
        name: 'lighta',
        open: true,
        fields: [
            {
                x: [pgm.light.pos[0], -2, 2, .01],
                onChange: v => {pgm.light.pos[0] = v; moveLightMat(pgm.light);}
            },
            {
                y: [pgm.light.pos[1], -2, 2, .01],
                onChange: v => {pgm.light.pos[1] = v; moveLightMat(pgm.light);}
            },
            {
                z: [pgm.light.pos[2], -1, 8, .01],
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
                dz: [-pgm.uniforms.lighta.dz, 0, 2, .001],
                onChange: v =>{pgm.uniforms.lighta.dz = -v;}
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
                hue: [pgm.a_hsv[0], 0, 1, .001],
                onChange: (v)=>{
                    pgm.a_hsv[0] = v;
                    pgm.uniforms.lighta.col = hsv2rgb(...pgm.a_hsv);
                },
            },
            {
                s_trim: [pgm.light.s_trim, 0, 2, .001], 
                onChange: (v)=>{ pgm.light.s_trim = v; moveLightMat(pgm.light);}
            }
        ]
    },
    {
        tetra_z: [pgm.sub[0].z, -2, 3, .01],
        onChange: (v)=>{
            pgm.sub[0].z = v;
             mat4.fromTranslation(pgm.sub[0].uniforms.mmat, [0,0,pgm.sub[0].z]);
        }
    },
    {
        camview_x: [eye.pos[0], -2, 2, 0.1],
        onChange: (v)=>{
            eye.pos[0] = v;
            setView(pgm.uniforms.vmat, eye.pos, eye.target, [0, 1, 0]);
        }
    },
    {
        camview_tx: [eye.target[0], -2, 2, 0.1],
        onChange: (v)=>{
            eye.target[0] = v;
            setView(pgm.uniforms.vmat, eye.pos, eye.target, [0, 1, 0]);
        }
    },
    {
        camview_z: [eye.pos[2], -1, 6, 0.1],
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

    gl.bindFramebuffer(gl.FRAMEBUFFER, pgm.targets.depth.framebuffer);
    gl.viewport(0, 0, mgl.depth_dim, mgl.depth_dim);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mgl.useProgram(gl, pgm, 1);

    mgl.enableAttributes(gl, pgm);
    mgl.setUniforms(gl, pgm);
    mgl.drawObj(gl, pgm);

    p.render(gl, p);
    mgl.enableAttributes(gl, p);
    mgl.setUniforms(gl, p);
    mgl.drawObj(gl, p);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, res[0], res[1]);
    // gl.bindTexture(gl.TEXTURE_2D, pgm.targets.depth.texture);
    mgl.useProgram(gl, pgm, 0);

    mgl.enableAttributes(gl, pgm);
    mgl.setUniforms(gl, pgm);
    mgl.drawObj(gl, pgm);

    mgl.enableAttributes(gl, p);
    mgl.setUniforms(gl, p);
    mgl.drawObj(gl, p);

}

// ---
function init(canvas, w, h, pgm, render, gui = {}) {
    canvas.width = res[0];
    canvas.height = res[1];
    canvas.style.width = res[0] + "px";
    canvas.style.height = res[1] + "px";
    canvas.onmousemove = (e) => {
        mouse[0] = e.offsetX / res[0];
        mouse[1] = 1 - e.offsetY / res[1];
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
    pgm.post ??= () => {};
    pgm.setup(gl, pgm);
    mgl.createShaderProgram(gl, pgm);
    mgl.setBuffers(gl, pgm);
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

init(document.querySelector("canvas"), ...res, pgm, draw, gui);
