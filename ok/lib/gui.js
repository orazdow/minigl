import {GUI} from './dat.gui.module.min.js';

export default function initGui(obj, btn=false){
    if(!obj.fields) return;
    let dat = new GUI();
    if(!btn)dat.__closeButton.style.visibility = "hidden";
    if(obj.name === null) obj._gui = dat;
    else obj._gui = dat.addFolder(obj.name||'');
    if(obj.open) obj._gui.open(); 
    addGuiObj(obj._gui, obj); 
}

function guiSubFolder(gui, obj){
    let g = gui.addFolder(obj.name||'');
    if(obj.open) g.open();
    addGuiObj(g, obj);
    g.title = g.__ul.firstChild;
}

function addGuiObj(gui, obj, ctl){
    let i = 0;
    for(let o of obj.fields||[]){
        if(o.fields){guiSubFolder(gui, o); continue;}
        let f;
        if(f = o.onChange) delete o.onChange;
        o = getArrayParams(o);
        let params = [o, Object.keys(o)[0], ...Object.values(o).slice(1)];
        let g = gui.add(...params);
        if(f) g.onChange(f);
        obj.fields[i++].ref = g;
    }    
}

function getArrayParams(o){
    let e = Object.entries(o)[0];
    if(e[1] instanceof Array){
        o[e[0]]= e[1][0];
        o.min = e[1][1];
        o.max = e[1][2];
        o.step = e[1][3];
    }return o;
}
