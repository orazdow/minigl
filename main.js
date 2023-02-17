import Glview from './glview.js';
import * as dat from "./lib/dat.gui.module.min.js";
// import prog from './programs/triangle.js';
// import prog from './programs/brownian.js';
import lines from './programs/lines.js';
import waves from './programs/waves.js';
import blob from './programs/sdfblob.js';
import sdf from './programs/sdf.js';
import lsys from './programs/lsys.js';
import quad from './programs/quadlines.js';
import geom from './programs/geom.js';


const canvas = document.querySelector('canvas');
const gui = new dat.GUI();

let animate = false;
const maingui = {
	fields: [{
		animate: animate,
		onChange: (v)=>{
			if(v) maingui.ctl.start();
			else maingui.ctl.stop();
		}
	}]
}
let demo = [sdf, blob, lines, waves];
const glview = new Glview(canvas, [quad,geom], [500,500], 0, gui, maingui);
// glview.start()
glview.frame()