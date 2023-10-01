# Minigl

##### minimal webgl library [demo]()

*MiniGl* facilitates webgl programs without much setup. 
Parameters are specified via an options object and multiple objects can be loaded or chained to create modular programs. These can be as minimal as a container for a shader or more complicated. 

The library consists of two files: **minigl.js** contains necessities for setting up a WebGL program. It uses a parameter format similar to [TWGL.js](https://twgljs.org/), and works as stripped-down version with essential functions in a single file, but in-depth texture handling, instancing and other features are not provided.  

**glview.js** provides a driver class that can setup a WebGL program in a single line and adds some extra functionality. Depending on the options in objects passed to it, programs can be set up with backbuffers or other render targets, chained together, given setup and render callbacks, or have other defaults overridden. Objects containing a simplified spec to setup gui controls can be specified as well which integrates with [dat.gui](https://github.com/dataarts/dat.gui). 

---
##### Usage: GLview

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

##### Program objects:

Available properties: `arrays, vs, fs, uniforms, textures, chain, gui, targets, drawMode, clearColor, clear, setupcb, rendercb, on`

The default object [here]() provides defaults for any fields not present in a program. Any combination can be used, an empty object would be a viewport with a default vertex and fragment shader. For shader art the `fs` and `uniforms` fields alone will suffice. `chain` and `gui` are also commonly useful.

**arrays:** sets vertex buffer data. The attribute `position` creates a vao, `indices` creates an index buffer. Any other name creates a buffer. Additionally, data can be interleaved into a buffer with other attributes referring to it by name ([example]()). If an empty object is specified no vertex buffer will be created. If the program is chained will use the parent vao. 

**vs:** vertex shader

**fs:** fragment shader

**uniforms:**  key value pairs to set uniforms in the shader program

**textures:** 

