import Glview from './glview.js';
import * as dat from "./lib/dat.gui.module.min.js";
import tex from './programs/tex.js';
import feedback from './programs/feedback.js';
import b from './programs/buff2.js';

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

const pgm = [tex, feedback];
const glview = new Glview(canvas, b, [500,500], 0, gui, maingui);
if (animate) glview.start(); else glview.frame();
// todo: delta or fixed time, onrezize, texture array, multipass test, targets: nocanvas, renderbuffer, example progs, loader/normals prog, docs