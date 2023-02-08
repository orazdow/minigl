const fs = /*glsl*/`#version 300 es
    precision mediump float;
    in vec3 vcolor;
    out vec4 fragColor;
    uniform float time;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float a;
    #define g gl_FragCoord

    void main() {
        vec2 uv = (2.*gl_FragCoord.xy-resolution)/resolution.y;
        float f = sin(8.*dot(uv,uv)+time)*.5+.5;
    	vec3 col = vcolor + .5*a*(cos(time+(g.x+g.y)/20.)*.2+.2)*f;
        fragColor = vec4(col*col, 1.);
    }
`;

const _fs = /*glsl*/`#version 300 es
    precision mediump float;
    out vec4 fragColor;
    in vec3 vcolor;
    uniform float time;
    uniform vec2 resolution;
    uniform vec2 mouse;

    #define glf gl_FragCoord

    void main() {
    	vec2 uv = (2.*glf.xy-resolution.xy)/resolution.y;
    	vec2 v = vec2(sin(time*.4), cos(time*.27))*.3; 
    	float f = dot((1.+mouse.y*18.)*uv-v,uv-v);
    	vec3 col = vec3(.01/(f*f));
        fragColor = vec4(vcolor*col, 1.);
    }
`;

const _vs =/*glsl*/`#version 300 es

	precision mediump float;
	in vec3 position;
	in vec3 color;
	out vec3 vcolor;
	uniform float time;
	uniform vec2 mouse;

    void main() {
    	vcolor = color;
    	float t = time*.1;
    	mat2 m = mat2(cos(t), -sin(t), sin(t), cos(t));
    	vec2 mm = mouse*2.-1.;
        gl_Position = vec4((sin(time*.2)*.2+1.2)*1.3*position.xy*m,0., 1.);
    }
`;

const testprog = {
	arrays: {
		position: {
			components: 2,
			stride:5,
			offset: 0,
			data: [
				-1,-1, 0,1,0,
				1,-1,  0,0,1,
				-1,1,  0,0,1,
				1,1,   1,0,0,
			]
		},
		color: {
			components: 3,
			stride:5,
			offset: 2,
			data: 'position'
			// data: [.5,.2,.3, .2, .4, .9, .1,.2,.3, .6, .4, .2,]
		}
	},
	uniforms: {a: 1},
	drawMode: 'TRIANGLE_STRIP'
}

const gui = {
    name: 'tri',
    open: false,
    switch: true,
    updateFame: true,
    fields:[
        {
            a: 4,
            min: 0.0,
            max: 10.0,
            step: 0.01,
            onChange : (v)=>{prog.uniforms.a = v;}
        },
        {
            b: 4,
            min: 0.0,
            max: 10.0,
            step: 0.01,
            onChange : (v)=>{prog2.uniforms.a = v;}
        }
    ]
}

const prog = {
	// arrays: {}, // empty object uses previous vao
	fs : fs,
	uniforms: {a:4},
	gui: gui
}

const prog2 = {
	arrays: {
		position: {
			components: 2,
			data: [-.3,-.3,  .3,-.3, 0,.2]
		},
		color:{
			components: 3,
			data: [.4,0,.8, .1,0,.8, .4,.5,.7]
		}
	},
	vs: _vs,
	fs: _fs,
	uniforms: {a: 1}
}


prog.chain = [prog2];

export default prog;