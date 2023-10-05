# Minigl

##### minimal webgl library [demo]()

MiniGL is a library to facilitate WebGL consisting of two files: 

**minigl.js** contains necessities to set up a program. It works similar to [TWGL.js](https://twgljs.org/) but stripped down to a few features. **glview.js**  provides a driver class to set up and run programs. Depending on the parameters,  programs can override defaults, be given backbuffers or other targets, chained together, or integrated with [dat.gui](https://github.com/dataarts/dat.gui). 

---
#### Usage: GLview

**constructor:** `(canvas, pgms, res, fps, gui, guiobj)` 

**types:** `el`, `{}/[]`, `[w, h]/null`, `int`, `dat.gui obj`, `optional obj`

```js
const glview = new Glview(canvas, pgm, [600,600], 0, gui, mainctl); //or
const glview = new Glview(canvas, pgm);
```
<div style="line-height:1.5;">

If `pgms` is an array of objects and dat.gui is used, a selector control will be added to the gui. 

If `res` is defined the canvas will be resized otherwise its dimensions will be used.

If `fps` > 0 the framerate will be limited below the default refresh rate.

`gui` is a dat.gui object, `guiobj` is for optional controls not specific to any pgm.

</div>

**methods:** `start()`, `stop()`, `frame(time)`, `switchProgram(index)`

<div>
example:

```js
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
</div>

#### Programs

Available properties: `vs, fs, uniforms, arrays, chain, gui, textures, targets, drawMode, setupcb, rendercb, draw, clearColor, clear, on`

<div>
example:

```js
const pgm = {
    fs: fs,
    uniforms:{
        light_angle: [.3,-.3, -1],
        num: 8,
        points: pointsArray
    },
    setupcb: setup,
    rendercb: render,
    targets: {
        texture: true,
        renderbuffer: true
    },
    gui: gui
};
```

A template [object](https://github.com/orazdow/minigl/blob/9f75e7654492d6f42e83c6548a62e3e77694702d/glview.js#L33) provides defaults for any property not present in a program. An empty object would display a default shader to the viewport. For shader art the `fs` and `uniforms` fields alone will suffice.  Available settings  are explained below:

</div>

</div>

<details>

<summary>Program Options:</summary>

<div style="line-height:1.3;">

**vs:** vertex shader string

**fs:** fragment shader string

**uniforms:**  key : value pairs to set uniforms in the shader program

**arrays:** sets buffer data. The attribute `position` creates a vao, `indices` creates an index buffer. Any other name creates a vertex buffer. Data can be interleaved into a buffer with other attributes referring to it by name [example](https://github.com/orazdow/minigl/blob/4cfaf3b0c97410ac55f19f90ba60c66f3d5b8ae8/programs/tex.js#L41). If an empty object is specified no buffers will be created and the last bound vao is used. 

**chain:** array of programs to draw successively. This can assigned to an object in the main file where others are imported. Chained programs will not clear the canvas unless specified. 

**gui:** object specifying gui controls. In a chain each program's gui will be added to the gui interface of the active parent program. For usage and options see the section [below](#gui).

**textures:** array of texture objects. The fields are: `src` : image  path (or array). `uniform` : uniform name for setting correct texture unit. `type` : defaults to `TEXTURE_2D`, `TEXTURE_2D_ARRAY` can also be used. `min`, `mag` : min/mag filters default to `LINEAR`. `wrap_s`, `wrap_t` : wrap settings default to `REPEAT`. `wrap` : parameter for both. `mipmap` : generate mipmap. If only `src` is provided, the file will load a 2D texture with default settings.

**targets:** specifies additional render targets. Setting either of two targets to `true` will populate an object in its place. Glview will use a corresponding draw function. `texture` creates a texture target in addition to the canvas to be used by other programs. If both `texture` and `renderbuffer` targets are set to `true`, a backbuffer will be set up.

**drawMode:** the draw mode to use: i.e `TRIANGLES` , `TRIANGLE_STRIP`

**setupcb:** callback registered to be called on init. This is passed the program itself which has a `ctl` field referencing the glview object. This can be used to setup custom geometry before buffers are created or for any other setup task.

**rendercb:** callback running before each frame. It is passed the program object after the time and mouse uniforms have been updated.

**draw:** If set, this is used as a custom draw function instead of the defaults [here](https://github.com/orazdow/minigl/blob/9f75e7654492d6f42e83c6548a62e3e77694702d/glview.js#L225). This could be set in setupcb for access to the gl context or minigl object.

**clearColor:** defaults to [0,0,0,0]

**clear:** this could be used by chained programs meant use a texture target instead of blending over the canvas.

**on:** Toggles the program. Intended to be used by the GUI.
</div>

</details>

----

#### GUI

<div style="line-height:1.3">

Gui objects have the following properties: 

`name`: *str*, `open`: *bool*, `updateFrame`: *bool*, `switch`: bool, `fields`: *array*

`fields` is an array of objects specifying controls with the format:

<div style="line-height:1">

---

**(name) : initial value**, 

**min : min value** (opt),

**max : max value** (opt),

**step : step value** (opt),

**onChange : function**

---

</div>

If **min** and **max** are not present, the control will be an input field, checkbox, or button depending on the initial value type (number/string, boolean, function)

The most common use of **onChange** is to set the program object's uniform values:

```js
onChange: (v)=>{ prog.uniforms.a = v; } 
```

A shorthand format can replace the min, max, step fields if the initial value is an array:

```js
{
    alpha: [.5, 0, 1, .01],
    onChange: v => {prog.uniforms.alpha = v;}
}
```

An object in `fields` can itself be a gui object with its own `fields` property, meaning you can recursively nest folders.


</div>

The `name` property of the gui object sets the folder name that controls in `fields` are children of. `open` sets whether the folder is open by default. `updateFrame` will make GLview render a frame when a control is changed if the render loop is stopped. `switch` adds a toggle to disable the program using the gui.

<div>

<details>
<summary>example:</summary>

```js
const gui = {
    name: 'wave',
    open: true,
    updateFrame: true,
    fields: [
        {
            amp: 1,
            min: .5,
            max: 5,
            step: .1,
            onChange: (v)=>{
                prog.uniforms.amp = v;
            }
        },
        {
            lightx: [.2,0,1,.1],
            onChange: v => {prog.uniforms.light[0] = v;}
        },
        {
            lighty: [.5,0,1,.1],
            onChange: v => {prog.uniforms.light[1] = v;}
        },
        {
            invert: false,
            onChange: (v)=>{
                prog.uniforms.invert = +v;
            }
        },
        {
            name: 'hsv',
            open: false,
            updateFrame: true,
            fields: [
                {
                    h: [.7, 0, 1, .01],
                    onChange: v => {
                        hsv[0] = v;
                        prog.uniforms.c = hsv2rgb(...hsv);
                    }
                },
                {
                    s: [.8, 0, 1, .01],
                    onChange: v => {
                        hsv[1] = v;
                        prog.uniforms.c = hsv2rgb(...hsv);
                    }
                },
                {
                    v: [.5, 0, 1, .01],
                    onChange: v => {
                        hsv[2] = v;
                        prog.uniforms.c = hsv2rgb(...hsv);
                    }
                },
            ]
        }

    ]
};
```
</details>

</div>










