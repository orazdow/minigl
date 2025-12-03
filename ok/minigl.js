
const depth_dim = 1024;

function createShaderProgram(gl, obj){
    let rtn = 1;
    if(obj.shader){
        if(!obj.shader.program) rtn &&= compileShader(gl, obj.shader);
    }else {
        for(let shader of obj.shaders || []){
            if(!shader.program) rtn &&= compileShader(gl, shader);
        }
        obj.shader = obj.shaders[0];
    }
    return rtn;
}

function compileShader(gl, shader){
    let vs = gl.createShader(gl.VERTEX_SHADER);
    let fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vs, shader.vs);
    gl.shaderSource(fs, shader.fs);
    gl.compileShader(fs);
    gl.compileShader(vs);
    let compiled = [vs, fs].every((shader, i)=>{
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            console.log('error compiling', i ? 'fragment':'vertex', 'shader:');
            console.log(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return false; 
        }   return true;
    });
    if(!compiled) return null;
    let pgm = gl.createProgram();
    gl.attachShader(pgm, vs);
    gl.attachShader(pgm, fs);
    gl.linkProgram(pgm);
    shader.program = pgm;
    shader.uniformSetters = uniformSetters(gl, pgm);
    return 1;
}

function attribSetup(gl, obj){ 
    for(let key in obj.arrays)
        obj.arrays[key].location = gl.getAttribLocation(obj.shader.program, key); 
    if(typeof obj.drawMode === 'string') obj.drawMode = gl[obj.drawMode];
    else if (typeof obj.drawMode !== 'number') obj.drawMode = gl.TRIANGLES;
}

function setBuffers(gl, obj, arrays){
    attribSetup(gl, obj);
    let attribs =  arrays || obj.arrays;
    for(let key in attribs){ 
        let attr = attribs[key];
        if(attr.location < 0 || !attr.data.length) continue;
        let dataStr = typeof attr.data === 'string';
        if(dataStr) attr.buffer = attribs[attr.data].buffer;
        else attr.buffer = gl.createBuffer();
        if(key==='position'){
            attr.vao = gl.createVertexArray(); 
            gl.bindVertexArray(attr.vao);        
        }
        if(key==='indices'){ 
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, attr.buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(attr.data), gl.STATIC_DRAW); 
        }else{ 
            gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
            if(!dataStr)
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attr.data), gl.STATIC_DRAW);
            let stride = attr.stride || 0, offset = attr.offset || 0;
            gl.vertexAttribPointer(attr.location, attr.components, gl.FLOAT, 0, stride*4, offset*4);
            gl.enableVertexAttribArray(attr.location);
            gl.bindVertexArray(null);
        }
    }
    setCount(obj);
}

function enableAttributes(gl, obj){
    for(let key in obj.arrays){ 
        let attr = obj.arrays[key];
        if(attr.vao) gl.bindVertexArray(attr.vao);
        else if(attr.buffer && attr.location >= 0){ 
            if(key === 'indices') gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, attr.buffer);
            else {
                gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
                let stride = attr.stride||0, offset = attr.offset||0;
                gl.vertexAttribPointer(attr.location, attr.components, gl.FLOAT, 0, stride*4, offset*4);
                gl.enableVertexAttribArray(attr.location);                
            }
        }                 
    } 
}

function useProgram(gl, obj, idx=null){
    if(idx !== null && obj.shaders) obj.shader = obj.shaders[idx];
    for(let p of obj.sub||[]) p.shader = obj.shader;
    gl.useProgram(obj.shader.program);
}

function setUniforms(gl, obj, uobj=null){
    let uniforms = uobj || obj.uniforms
    for(let u in uniforms){
        if(uniforms[u].constructor === Object){
           for(let uo in uniforms[u])
                 obj.shader.uniformSetters[u+'.'+uo]?.(gl, uniforms[u][uo]);
        }
        else obj.shader.uniformSetters[u]?.(gl, uniforms[u]);
    }
}

function loadTextures(gl, obj){ 
    window.texindex ??= 0; 
    for(let o of obj.textures || []){
        if(!o || !o.src) return;
        o.index = window.texindex++;
        if(!o.type || o.type === 'TEXTURE_2D') 
            loadTexture2D(gl, obj, o);
    }
}

function loadTexture2D(gl, obj, tex){
    tex.texture = gl.createTexture();
    const img = new Image();
    let fmt = tex.format ? gl[tex.format] : gl.RGBA; 
    img.onload = ()=>{
        gl.useProgram(obj.shader.program);
        gl.activeTexture(gl.TEXTURE0 + tex.index);
        gl.bindTexture(gl.TEXTURE_2D, tex.texture); 
        gl.texImage2D(gl.TEXTURE_2D, 0, fmt, fmt, gl.UNSIGNED_BYTE, img);
        texOptions2D(gl, img, tex);
        if(obj.shader.uniformSetters[tex.uniform])
            obj.shader.uniformSetters[tex.uniform](gl, tex.index);
    }
    img.src = tex.src;
}

function isPowerOf2(value){
    return (value & (value - 1)) === 0;
}

function texOptions2D(gl, img, tex){
    if(tex.mipmap && isPowerOf2(img.width) && isPowerOf2(img.height))
        gl.generateMipmap(gl.TEXTURE_2D);
    let wrap_s = gl[tex.wrap_s || tex.wrap] || gl.REPEAT;
    let wrap_t = gl[tex.wrap_t || tex.wrap] || gl.REPEAT;
    let min = gl[tex.min] || gl.LINEAR; 
    let mag = gl[tex.mag] || gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap_s);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap_t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min); 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag); 
}

function drawObj(gl, obj){
    if(obj.arrays.indices)
        gl.drawElements(obj.drawMode, obj.count, gl.UNSIGNED_SHORT, 0);
    else gl.drawArrays(obj.drawMode, 0, obj.count);
}

function setCount(obj){
    if(obj.arrays.position){
        let count = obj.arrays.indices ? obj.arrays.indices.data.length : 
        obj.arrays.position.data.length/(obj.arrays.position.stride||obj.arrays.position.components);
        obj.count = count;          
    }
}

function setSubPgms(gl, pgm, inherit = true){
    if(!pgm.sub) return;
    let arr = pgm.sub.constructor == Array ? pgm.sub : [pgm.sub];
    for(let sub of arr){
        sub.drawMode ??= pgm.drawMode;
        sub.res ??= pgm.res;
        sub.setup ??= ()=>{};
        sub.render ??= ()=>{};
        sub.targets ??= ()=>{};
        sub.uniforms ??= pgm.uniforms;
        if(inherit) for(let u in pgm.uniforms) sub.uniforms[u] ??= pgm.uniforms[u]; 
        sub.shader ??= pgm.shader;
        if(!sub.shader.program) createShaderProgram(gl, sub);  
        sub.setup(gl, sub);
        if(!sub.arrays){
            sub.arrays = pgm.arrays;
            sub.count = pgm.count;
        } else setBuffers(gl, sub);
        setTargets(gl, sub);    
    }
}

function setTargets(gl, pgm){
    if(pgm.targets.render)
        pgm.targets.render = renderBufferTarget(gl, ...pgm.res);
    if(pgm.targets.texture)
        pgm.targets.texture = textureBufferTarget(gl, ...pgm.res);   
    if(pgm.targets.depth)
        pgm.targets.depth = depthBufferTarget(gl, ...pgm.res); 
}

function textureBufferTarget(gl, width, height){
    window.texindex ??= 0;
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + window.texindex);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {texture: texture, framebuffer: framebuffer, texindex: window.texindex++};
}

function renderBufferTarget(gl, width, height){
    const framebuffer = gl.createFramebuffer();
    const renderbuffer = gl.createRenderbuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, renderbuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {framebuffer: framebuffer, renderbuffer: renderbuffer};
}

function depthBufferTarget(gl, width, height){
    window.texindex ??= 0;
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + window.texindex);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, depth_dim, depth_dim);
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {texture: texture, framebuffer: framebuffer, texindex: window.texindex++};
}

function uniformSetters(gl, program){ 
    let setters = {};
    let count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for(let i = 0; i < count; i++){
        let info = gl.getActiveUniform(program, i);
        let loc = gl.getUniformLocation(program, info.name);
        let name = info.name.replace('[0]', '');
        setters[name] = utypes(gl, info.type, info.size, loc);
    }
    return setters;
}

function utypes(gl, type, size, loc){
    let v = (size > 1);
    switch(type){
        case gl.FLOAT : return v ? (gl,v)=>{gl.uniform1fv(loc, v)} : (gl,v)=>{gl.uniform1f(loc, v)};
        case gl.FLOAT_VEC2 : return v ? (gl,v)=>{gl.uniform2fv(loc, v)} : (gl,v)=>{gl.uniform2f(loc, ...v)};
        case gl.FLOAT_VEC3 : return v ? (gl,v)=>{gl.uniform3fv(loc, v)} : (gl,v)=>{gl.uniform3f(loc, ...v)};
        case gl.FLOAT_VEC4 : return v ? (gl,v)=>{gl.uniform4fv(loc, v)} : (gl,v)=>{gl.uniform4f(loc, ...v)};
        case gl.FLOAT_MAT2 : return (gl,v)=>{gl.uniformMatrix2fv(loc, false, v)};
        case gl.FLOAT_MAT3 : return (gl,v)=>{gl.uniformMatrix3fv(loc, false, v)};
        case gl.FLOAT_MAT4 : return (gl,v)=>{gl.uniformMatrix4fv(loc, false, v)};
        case gl.SAMPLER_2D : (gl,v)=>{gl.uniform1i(loc, v)};
        case gl.SAMPLER_3D : (gl,v)=>{gl.uniform1i(loc, v)};
        case gl.SAMPLER_2D_ARRAY : (gl,v)=>{gl.uniform1iv(loc, v)};
        case gl.SAMPLER_CUBE : (gl,v)=>{gl.uniform1i(loc, v)};
        case gl.BOOL : return v ? (gl,v)=>{gl.uniform1iv(loc, v)} : (gl,v)=>{gl.uniform1i(loc, v)};
        case gl.INT : return v ? (gl,v)=>{gl.uniform1iv(loc, v)} : (gl,v)=>{gl.uniform1i(loc, v)};
        case gl.INT_VEC2 : return v ? (gl,v)=>{gl.uniform2iv(loc, v)} : (gl,v)=>{gl.uniform2i(loc, ...v)};
        case gl.INT_VEC3 : return v ? (gl,v)=>{gl.uniform3iv(loc, v)} : (gl,v)=>{gl.uniform3i(loc, ...v)};
        case gl.INT_VEC4 : return v ? (gl,v)=>{gl.uniform4iv(loc, v)} : (gl,v)=>{gl.uniform4i(loc, ...v)};
    }
}

export {
    createShaderProgram, 
    setBuffers, 
    enableAttributes, 
    useProgram,
    setUniforms, 
    drawObj, 
    loadTextures, 
    textureBufferTarget, 
    renderBufferTarget,
    depthBufferTarget,
    setSubPgms,
    setTargets,
    depth_dim
}