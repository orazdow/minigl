
// scale   : model scale
// hom     : use homogenous coordinates
// vn      : compute vertex normals
// fn      : (re)compute face normals
// tc      : generate texcoords (spherical)
// tangent : compute tangets 

function loadObj(str, {scale=1, hom=true, vn=false, fn=false, tc=false, tangent=false}={}){
    let obj = {
        vertices: {v:[], vt:[], vn:[], tangent:[]},
        elements: {
            p:{v:[], vt:[], vn:[]},
            l:{v:[], vt:[], vn:[]}, 
            f:{v:[], vt:[], vn:[], tangent:[]}
        },
        indices: {v:[], vt:[], vn:[], tangent:[]}
    };
    let a = str.split('\n');
    for(let s of a){

        let arr = s.split(' ').filter(el=> el!='');
        let c = arr.shift();

        switch(c){
            case 'v':
                arr = arr.map(f=>+f*scale);
                if(hom && arr.length == 3) arr.push(1);
                obj.vertices.v.push(arr);
            break;

            case 'vt':
                 arr = arr.map(f=>+f);
                 if(hom && arr.length == 3) arr.push(1);
                obj.vertices.vt.push(arr);
            break;

            case 'vn':
                 arr = arr.map(f=>+f);
                 if(hom && arr.length == 3) arr.push(1);
                obj.vertices.vn.push(arr);
            break;
            
            case 'f':
            case 'l':
            case 'p':
                let f = obj.elements[c];
                let v = [], vt = [], vn = [];
                if(arr.length > 3) console.log('warning: > 3 vertices in element: ', arr.length);
                for(let e of arr){
                    let el = e.split('/').filter(el=> el!='');
                    switch(el.length){
                        case 1:
                            v.push(+el[0]-1);
                        break;
                        case 2:
                            v.push(+el[0]-1);
                            vn.push(+el[1]-1);
                        break;
                        case 3:
                            v.push(+el[0]-1);
                            vt.push(+el[1]-1);
                            vn.push(+el[2]-1);
                        break;
                    }
                }
                if(v.length) f.v.push(v);
                if(vt.length) f.vt.push(vt);
                if(vn.length) f.vn.push(vn);
        }
    }

    
    if(fn || !obj.elements.f.vn.length)
        computeNormals(obj, vn);

    if(tangent) getTangents(obj);

   // synthestic texcoords --spherical 
   if(tc && !obj.elements.f.vt.length){
        let vi = 0, v = obj.vertices.v;
        for(let f of obj.elements.f.v){
            let uv1 = sphericalUV(v[f[0]]);
            let uv2 = sphericalUV(v[f[1]]);
            let uv3 = sphericalUV(v[f[2]]);
            obj.vertices.vt.push(uv1, uv2, uv3);
            obj.elements.f.vt.push([vi++, vi++, vi++]);
        }  
   }
    
    for(let e in obj.elements){ 
        for(let i in obj.elements[e]){
            for(let el of obj.elements[e][i]){ obj.indices[i].push(el)}
        }
    }
    return obj;
}

function computeNormals(obj, vn=0){ 
    let _vn = [], _fvn = [];
    let vmap = {};
    let vi = 0, v = obj.vertices.v;
    for(let f of obj.elements.f.v){
        let v1 = subv(v[f[0]], v[f[1]])
        let v2 = subv(v[f[1]], v[f[2]])
        let n = [...normalize(cross(v1,v2)),1];   
        _vn.push(n);
        _fvn.push([vi, vi, vi]);
        vi++;
        if(vn)
        for(let _i of f){
            let vk = v[_i].join('');
            vmap[vk] ??= [];
            vmap[vk].push(n);
        }
    }
    obj.vertices.vn = _vn;
    obj.elements.f.vn = _fvn;
    // slow for large models
    if(vn){
        for(let v in vmap) vmap[v] = [...averagev(vmap[v]),1];
        obj.vertices.vn = Object.values(vmap);
        for(let i = 0; i < obj.elements.f.v.length; i++){ 
            let f = obj.elements.f.v[i];
            obj.elements.f.vn[i] = f.map(_i => {
                let vk = v[_i].join('');
                return Object.keys(vmap).indexOf(vk);
            });
        }
    }
}

function getTangents(obj){
    let v = obj.vertices.v;
    let vt = obj.vertices.vt;
    let idx = 0;
    for(let i = 0; i < obj.elements.f.v.length; i++){
        let fv = obj.elements.f.v[i];
        let ft = obj.elements.f.vt[i];
        let e1 = subv(v[fv[0]], v[fv[1]])
        let e2 = subv(v[fv[1]], v[fv[2]])
        let d1 = subv(vt[ft[0]], vt[ft[1]])
        let d2 = subv(vt[ft[1]], vt[ft[2]])
        let ff = 1./(d1[0]*d2[1] - d2[0]*d1[1]);
        let n = normalize(cross(e1,e2));
        let tn = [
            ff*(d2[1]*e1[0] - d1[1]*e2[0]),
            ff*(d2[1]*e1[1] - d1[1]*e2[1]),
            ff*(d2[1]*e1[2] - d1[1]*e2[2])];
        let btn = [
            ff*(-d2[0]*e1[0] + d1[0]*e2[0]),
            ff*(-d2[0]*e1[1] + d1[0]*e2[1]),
            ff*(-d2[0]*e1[2] + d1[0]*e2[2])];
        let sign = dot(cross(n, tn), btn) < 0 ? -1 : 1;
        // orthogonalize
        tn = subv(tn, mults(n, dot(n, tn)));
        let tangent = [...normalize(tn), sign];
        obj.vertices.tangent.push(tangent, tangent, tangent);
        obj.elements.f.tangent.push([idx,  idx+1, idx+2]);
        obj.indices.tangent.push([idx,  idx+1, idx+2]);
        idx += 3;
    }        
}

function modelData(model, {position, normal, texcoord, tangent}){
    if(position) for (let t of model.indices.v)
        for (let i of t) position.data.push(...model.vertices.v[i]);
    if(normal) for (let t of model.indices.vn)
        for (let i of t) normal.data.push(...model.vertices.vn[i]);
    if(texcoord) for (let t of model.indices.vt)
        for (let i of t) texcoord.data.push(...model.vertices.vt[i]);
    if(tangent) for(let t of model.indices.tangent)
        for (let i of t) tangent.data.push(...model.vertices.tangent[i]);
}

function getDim(obj){
    let arr = obj.vertices.v;
    let _x = arr.map(e => e[0]);
    let _y = arr.map(e => e[1]);
    let _z = arr.map(e => e[2]);
    let xmin = Math.min(..._x);
    let xmax = Math.max(..._x);
    let ymin = Math.min(..._y);
    let ymax = Math.max(..._y);
    let zmin = Math.min(..._z);
    let zmax = Math.max(..._z);
    obj.dim = {
        xmax: xmax,
        xmin: xmin,
        ymax: ymax,
        ymin: ymin,
        zmax: zmax,
        zmin: zmin
    }
}

function edgeList(elements){
    let edges = {};
    function add(a, b){
        let key = a <= b ? a+' '+b : b+' '+a;
        edges[key] = a < b ? [a, b] : [b, a];
    }
    for(let f of elements){
        let n = f.length;
        if(n == 2){
            add(f[0], f[1]);
        }else if(n > 2){
            for(let i = 0; i < n; i++){
                let a = f[i], b = f[(i+1)%n];
                add(a, b);
            }
        }
    }
    return Object.values(edges);
}

function normalize(v){
    let d = Math.sqrt(v[0]**2+v[1]**2+v[2]**2) || 1;
    return mults(v, 1/d);
}
function cross(a, b){
    return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
}
function dot(a, b){
  return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
}
function addv(a, b){
    return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}
function subv(a, b){
    return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}
function multv(a, b){
    return [a[0]*b[0], a[1]*b[1], a[2]*b[2]];
}
function mults(v, s){
    return [v[0]*s, v[1]*s, v[2]*s];
}
function adds(v, s){
    return [v[0]+s, v[1]+s, v[2]+s];
}
function averagev(a){
    let v = [0,0,0];
    // should loop for any len
    v = addv(v, a[0]);
    v = addv(v, a[1]);
    v = addv(v, a[2]);
    return mults(v, 0.3333333333333);
}

function sphericalUV(_v){
    let r = normalize([_v[0], _v[1], _v[2]]);
    let u = Math.atan2(r[2], r[0]) / (2*Math.PI) + .5;
    let v = Math.asin(r[1]) / Math.PI + .5;
    return [u, v];
}

function getModelJson(obj, filename){
 // import model from "./model.json" with { type: "json" };
    const json = JSON.stringify(obj);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}

export {loadObj, edgeList, getDim, modelData};
