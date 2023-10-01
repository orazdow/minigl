# Minigl

##### minimal webgl library [demo]()

*MiniGl* facilitates webgl programs without much setup. 
Parameters are specified by an options object and multiple objects can be loaded or chained to create modular programs. These can be as minimal as a container for a shader or more complicated. 

The library consists of two files: **minigl.js** contains necessities for setting up a WebGL program. It uses a parameter format similar to [TWGL.js](https://twgljs.org/), and works as stripped-down version with essential functions in a single file, but in-depth texture handling, instancing and other features are not provided.  

**glview.js** provides a driver class that can setup a WebGL program in a single line and adds some extra functionality. Depending on the options in objects passed to it, programs can be set up with backbuffers or other render targets, chained together, given setup and render callbacks, or have other defaults overridden. Objects containing a simplified spec to setup gui controls can be specified as well which integrates with [dat.gui](https://github.com/dataarts/dat.gui). 

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

---

#### Programs:

Available properties: `vs, fs, arrays, uniforms, textures, chain, gui, targets, drawMode, setupcb, rendercb, draw, clearColor, clear, on`

The default object [here](https://github.com/orazdow/minigl/blob/9f75e7654492d6f42e83c6548a62e3e77694702d/glview.js#L33) provides defaults for any field not present in a program. Any combination can be used; an empty object would be a viewport with a default vertex and fragment shader. For shader art the `fs` and `uniforms` fields alone will suffice. `chain` and `gui` are also commonly useful. Available settings  are explained below:

**vs:** vertex shader

**fs:** fragment shader


**arrays:** sets vertex buffer data. The attribute `position` creates a vao, `indices` creates an index buffer. Any other name creates a buffer. Additionally data can be interleaved into a buffer with other attributes referring to it by name ([example]()). If an empty object is specified no vertex buffer will be created. A chained program will use the parent vao. 

**uniforms:**  key : value pairs to set uniforms in the shader program

**textures:** array of objects specifying textures. The fields are: `src`: image  path (or array). `uniform`: uniform name for setting correct texture unit. `type`: defaults to TEXTURE_2D, TEXTURE_2D_ARRAY can also be used. `min`, `mag`: min/mag filters default to LINEAR. `wrap_s`, `wrap_t`: wrap settings default to REPEAT. `wrap`: parameter for both. `mipmap`: generate mipmap. If only `src` is provided, the file will load a 2D texture with default settings.

**chain:** an array of programs to draw successively. This can assigned to an object in the main file where others are imported. Chained programs will not clear the canvas unless specified. 

**gui:** an object with a simplified format for creating controls. In a chain, each program's gui will be added to the gui interface of the active parent program. For usage and options see the section [below]().

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


