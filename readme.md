# Minigl

##### minimal webgl library [demo]()

MiniGl facilitates webgl programs without much setup. 
Parameters are specified in program objects and multiple objects can be loaded or chained to create modular programs. These can be as minimal as a container for a shader or more complicated. 

The library consists of two files: **minigl.js** contains necessities for setting up a WebGL program. It works as a stripped down version of [TWGL.js](https://twgljs.org/) but many features are not provided.  

**glview.js** provides a driver class to setup WebGL programs and adds extra functionality. Depending on the options passed to it, programs can be set up with backbuffers or other targets, chained together, and integrated with [dat.gui](https://github.com/dataarts/dat.gui). 

---
#### Usage: GLview

**constructor:** `(canvas, pgms, res, fps, gui, guiobj)` 

**types:** `el`, `{} / []`, `[w, h] / null`, `int`, `dat.gui obj`, `optional obj`

```
const glview = new Glview(canvas, pgm, [600,600], 0, gui, mainctl);
const glview = new Glview(canvas, pgm);
```

If `pgms` is an array of objects and dat.gui is used, a selector control will be added to the gui. 

If `res` is defined the canvas will be resized otherwise its dimensions will be used.

If `fps` > 0 the framerate will be limited below the default refresh rate.

`gui` is a dat.gui object, `guiobj` is for optional controls not specific to any pgm.

**methods:** `start()`, `stop()`, `frame(time)`, `switchProgram(index)`

Example:

```
import Glview from './glview.js';

const fs = `#version 300 es
    precision mediump float;
    uniform vec2 resolution;
    uniform float time;
    out vec4 fragColor;
    
    void main(){
        vec3 c = cos(time+gl_FragCoord.xyx*.002*vec3(0,2,3))*.5+.5;
        fragColor = vec4(c, 1);
    }
`;

const canvas = document.querySelector('canvas');
const glview = new Glview(canvas, {fs: fs});
glview.start();
```

---

#### Programs:

Available properties: `vs, fs, uniforms, arrays, chain, gui, textures, targets, drawMode, setupcb, rendercb, draw, clearColor, clear, on`

```
const pgm = {
    fs: fs,
    uniforms:{
        light: .5,
        angle: [.3,-.3]
    },
    gui: gui
};
```

A template [object](https://github.com/orazdow/minigl/blob/9f75e7654492d6f42e83c6548a62e3e77694702d/glview.js#L33) provides defaults for any field not present in a program. Any combination of properties can be used; an empty object would be a viewport with a default vertex and fragment shader. For shader art the `fs` and `uniforms` fields alone will suffice. `chain` and `gui` are also commonly useful. Available settings  are explained below:

**vs:** vertex shader string

**fs:** fragment shader string

**uniforms:**  key : value pairs to set uniforms in the shader program

**arrays:** sets vertex buffer data. The attribute `position` creates a vao, `indices` creates an index buffer. Any other name creates a vertex buffer. Additionally data can be interleaved into a buffer with other attributes referring to it by name [example](https://github.com/orazdow/minigl/blob/4cfaf3b0c97410ac55f19f90ba60c66f3d5b8ae8/programs/tex.js#L41). If an empty object is specified no buffers will be created and the last bound vao is used. 

**chain:** an array of programs to draw successively. This can assigned to an object in the main file where others are imported. Chained programs will not clear the canvas unless specified. 

**gui:** an object with a simplified format for creating controls. In a chain, each program's gui will be added to the gui interface of the active parent program. For usage and options see the section [below](#gui).

**textures:** array of objects specifying textures. The fields are: `src`: image  path (or array). `uniform`: uniform name for setting correct texture unit. `type`: defaults to TEXTURE_2D, TEXTURE_2D_ARRAY can also be used. `min`, `mag`: min/mag filters default to LINEAR. `wrap_s`, `wrap_t`: wrap settings default to REPEAT. `wrap`: parameter for both. `mipmap`: generate mipmap. If only `src` is provided, the file will load a 2D texture with default settings.

**targets:** an object specifying additional render targets. Setting either of the two targets to `true` will populate an object in its place which glview will use by substituting a draw function. `texture` creates a texture and framebuffer that will be drawn to in addition to the canvas. This can be used by other programs for multi-pass effects. `renderbuffer` will do the same with a renderbuffer which is bot especially useful unless the `texture` target is also set to true. If both `texture` and `renderbuffer` are used, a backbuffer will be set up.

**drawMode:** the draw mode to use: i.e `TRIANGLES` , `TRIANGLE_STRIP`

**setupcb:** a callback registered to be called on init. This is passed the program itself which has a `ctl` field referencing the glview object. This can be used to setup custom geometry before buffers are created or for any other setup task.

**rendercb:** a callback to be called before drawing each frame. This can be used for any purpose to manipulate data in the program. It is passed the program object after the time and mouse uniforms have been updated.

**draw:** If set, this is used as a custom draw function instead of the defaults [here](). This could be set in setupcb for access to the gl context or minigl object.

**clearColor:** defaults to [0,0,0,0]

**clear:** this could be used by chained programs meant use a texture target instead of blending over the canvas.

**on:** Toggles the program. Intended to be used by the GUI.

----

#### GUI


[comment]: <> (gui, examples, minigl)


