import Glview from './glview.js';
import * as dat from "./lib/dat.gui.module.min.js";
import tex from './programs/tex.js';
import feedback from './programs/feedback.js';

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
const glview = new Glview(canvas, pgm, [500,500], 0, gui, maingui);
if (animate) glview.start(); else glview.frame();