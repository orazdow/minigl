import Glview from './glview.js';
import * as dat from "./lib/dat.gui.module.min.js";
// import prog from './programs/triangle.js';
// import prog from './programs/brownian.js';
import lines from './programs/lines.js';
import waves from './programs/waves.js';
import blob from './programs/sdfblob.js';
import sdf from './programs/sdf.js';

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

const glview = new Glview(canvas, [sdf, blob, lines, waves], [500,500], 1, gui, maingui);
// glview.start()
glview.frame()