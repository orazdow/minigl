import Glview from './glview.js';
import * as dat from "./lib/dat.gui.module.min.js";
import prog from './programs/triangle.js';

const canvas = document.querySelector('canvas');
const pgms = [prog, {}];
const gui = new dat.GUI();

const glview = new Glview(canvas, pgms, [500,500], 1, gui);
// glview.start()
glview.frame()