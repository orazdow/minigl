import Glview from './glview.js';
import * as dat from "./lib/dat.gui.module.min.js";
import prog from './programs/tex.js';

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

const glview = new Glview(canvas, prog, [500,500], 50, gui, maingui);
if (animate) glview.start(); else glview.frame();