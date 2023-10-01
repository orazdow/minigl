# Minigl

##### minimal webgl library [demo]()

*MiniGl* is meant to facilitate webgl programs without much setup. 
Parameters are specified via an options object and multiple objects can be loaded or chained to create modular programs. These can be as minimal as a container for a shader or more complicated. 

The library consists of two files: **minigl.js** contains neccesities for setting up a WebGL program. It uses a parameter format similar to [TWGL.js](https://twgljs.org/), and works as stripped-down version with essential functions in a single file, but in-depth texture handling, instancing and other features are not provided.  

**glview.js** provides a driver class that can setup a WebGL program in a single line and adds some extra functionality. Depending on the options in objects passed to it, programs can be set up with backbuffers or other render targets, chained together, given setup and render callbacks, or have other defaults overriden. Objects containing a simplified spec to setup gui controls can be specified as well which is designed to integrate with [dat.gui](https://github.com/dataarts/dat.gui). 

---
##### Usage: GLview


**constructor:** `(canvas, pgms, res, fps, gui, guiobj)` 

**types:** `el`, `{} / []`, `[w, h] / null`, `int`, `dat.gui obj`, `optional`

```
const glview = new Glview(canvas, pgm, [600,600], 0, gui, mainctl);
const glview = new Glview(canvas, pgm);
```

If `pgms` is an array of objects and dat.gui is used a selector control will be added to the gui. 

If `res` is defined the canvas will be resized, otherwise it's dimensions will be used.

If `fps` > 0 the framerate will be limited below the default refresh rate.

`gui` is a dat.gui object, `guiobj` is for optional controls not specific to any pgm.

**methods:** `start`, `stop`, `frame(time)`, `switchProgram(index)`

---
