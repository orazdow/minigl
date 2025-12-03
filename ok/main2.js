import * as mgl from "./minigl.js";
import { loadObj } from "./lib/loader.js";
import * as mat4 from "./lib/glmat/mat4.js";
import * as shd from "./shaders.js";
import initGui from "./lib/gui.js";
import {solids, polyhedra, models} from './model.js';

const {PI, cos, sin, min, max} = Math;

var gl,req, res = [600, 600], mouse = [0, 0];
var fov = 0.8;
var r = 0.7;
var drawTetra = true;
var orthoshadowmat = false;
const eye = { x: 0, y: 0, z: 3, tx: 0, ty: 0, tz: -.5 };

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

const modelp = {
    arrays: {
        position: {
            components: 4,
            data: [],
        },
        normal: {
            components: 4,
            data: [],
        }
    },
    z: 0.7,
    uniforms: {
        mmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        rmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    },
    setup: (gl, pgm)=>{
        // let model = loadObj(tetra, .5, true);
        // let model = loadObj(solids.icosahedron, 0.5, true);
        let model = loadObj(models.salamander, 0.1, true);
        mdata(model, pgm.arrays.position.data, pgm.arrays.normal.data);
        mat4.fromTranslation(pgm.uniforms.mmat, [0,0,pgm.z]);
    },
    render: orbit
};

// -- bkgd plane
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
        showDepthTex: 0,
        // tex: 0,
        mmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        pmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        vmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        rmat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],

        lpmat: pointlight.pmat,
        lvmat: pointlight.vmat,
        
        lighta: {
            pos: pointlight.pos,
            dir: [0,0,0],
            col: [.7,.0,.5],
            pow: 30,
            spec: 1,
            diff: .7,
            dz: 0,
            am: 0,
            lev: 1
        },
    },
    ra: 0,
    rv: [1,0,0],
    z: -1,
    a_hsv: [0,1,1],
    setup: (gl, pgm) => {
        mat4.fromTranslation(pgm.uniforms.mmat, [0, 0, -1]);
        mat4.perspective(pgm.uniforms.pmat, fov, pgm.res[0] / pgm.res[1], 0.05, 20);
        mat4.lookAt(pgm.uniforms.vmat,[eye.x, eye.y, eye.z],[0, eye.tx, eye.tz],[0, 1, 0]);
        // depth
        mat4.perspective(pgm.light.pmat, 1, pgm.res[0]/pgm.res[1], .1, 9);
        moveLightMat(pgm.light);
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

// load model data
function mdata(model, position, normal) {
    for (let t of model.indices.v)
        for (let i of t) position.push(...model.vertices.v[i]);
    for (let t of model.indices.vn)
        for (let i of t) normal.push(...model.vertices.vn[i]);
}

function orbit(gl, pgm) {
    let x = pgm.uniforms.mouse[0] - 0.5;
    let y = pgm.uniforms.mouse[1] - 0.5;
    mat4.rotate(pgm.uniforms.rmat, pgm.uniforms.rmat, r * Math.min(0.05 * Math.hypot(x, y), 0.05), [y, -x, 0]);
}

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
                lev: [pgm.uniforms.lighta.lev, 0, 1.5, .01],
                onChange: (v)=>{pgm.uniforms.lighta.lev = v;}
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
        tetra_z: [pgm.sub[0].z, -2, 2, .01],
        onChange: (v)=>{
            pgm.sub[0].z = v;
             mat4.fromTranslation(pgm.sub[0].uniforms.mmat, [0,0,pgm.sub[0].z]);
        }
    },
    {
        camview_x: [eye.tx, -2, 2, 0.1],
        onChange: (v)=>{
            eye.x = v;
            mat4.lookAt(pgm.uniforms.vmat,[eye.x, eye.y, eye.z],[eye.tx, eye.ty, eye.tz],[0, 1, 0]);
        }
    },
    {
        camview_tx: [eye.tx, -2, 2, 0.1],
        onChange: (v)=>{
            eye.tx = v;
            mat4.lookAt(pgm.uniforms.vmat,[eye.x, eye.y, eye.z],[eye.tx, eye.ty, eye.tz],[0, 1, 0]);
        }
    },
    {
        camview_z: [eye.z, -1, 6, 0.1],
        onChange: (v)=>{
            eye.z = v;
            mat4.lookAt(pgm.uniforms.vmat,[eye.x, eye.y, eye.z],[eye.tx, eye.ty, eye.tz],[0, 1, 0]);
        }
    },

    ],

};

// ---
function draw(gl, pgm, time) {

    pgm.uniforms.time = time * 0.001;
    pgm.uniforms.mouse = mouse;
    let p = pgm.sub[0]
    mgl.useProgram(gl, pgm);

    pgm.render(gl, pgm);
    mgl.enableAttributes(gl, pgm);
    mgl.setUniforms(gl, pgm);
    mgl.drawObj(gl, pgm);

    p.render(gl, p);
    mgl.enableAttributes(gl, p);
    mgl.setUniforms(gl, p);
    mgl.drawObj(gl, p);

}

function _draw(gl, pgm, time){
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

    p.shader = pgm.shader
    p.render(gl, p);
    mgl.enableAttributes(gl, p);
    mgl.setUniforms(gl, p);
    mgl.drawObj(gl, p);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, res[0], res[1]);
    gl.bindTexture(gl.TEXTURE_2D, pgm.targets.depth.texture);
    mgl.useProgram(gl, pgm, 0);

    mgl.enableAttributes(gl, pgm);
    mgl.setUniforms(gl, pgm);
    mgl.drawObj(gl, pgm);

    mgl.enableAttributes(gl, p);
    mgl.setUniforms(gl, p);
    mgl.drawObj(gl, p);

}

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

init(document.querySelector("canvas"), ...res, pgm, _draw, gui);
