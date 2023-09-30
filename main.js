import Glview from './glview.js';
import * as dat from "./lib/dat.gui.module.min.js";
import tex from './programs/tex.js';
import feedback from './programs/feedback.js';
import buff from './programs/buffertest.js';
import ring from './programs/ring.js';

const canvas = document.querySelector('canvas');
const gui = new dat.GUI();

let animate = true;

const maingui = {
    fields: [{
        animate: animate,
        onChange: (v)=>{
            if(v) maingui.ctl.start();
            else maingui.ctl.stop();
        }
    }]
}

feedback.chain = [ring];

const pgm = [buff,feedback, tex];
// const glview = new Glview(canvas, pgm);
const glview = new Glview(canvas, pgm, [600,600], 0, gui, maingui);
if (animate) glview.start(); else glview.frame();
// texture array, multipass test, target nocanvas, example progs, loader/normals prog, docs