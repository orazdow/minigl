const fs = /*glsl*/`#version 300 es
	precision highp float;

    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    out vec4 fragColor;

	#define fcoord gl_FragCoord
	#define res resolution
	#define sphere(v,r) (length(v)-r)

	vec3 ball(float t){
		return .6*vec3(sin(t*1.2)*cos(t*.82), cos(6.+t*.9)*sin(9.+t*1.15), sin(12.+t*.7)*cos(22.+t*1.33));
	}

	float meta(vec3 v, float t){
		float f = 1.;
		for(float i = 0.; i < 5.; i += 1.){
			f *= 1.3*distance(v, ball(t+i*90.));
		}
		return f;
	}

	float metah(vec3 v, float t){
		float f = 0.;
		for(float i = 0.; i < 5.; i += 1.){
			f += distance(v, ball(t+i*90.));
		}
		return f;
	}

	vec3 normal(vec3 v){
		vec3 h = vec3(.01,.0,.0);
		vec3 n = vec3(
			meta(v+h.xyy, time)-meta(v-h.xyy, time),
			meta(v+h.yxy, time)-meta(v-h.yxy, time),
			meta(v+h.yyx, time)-meta(v-h.yyx, time)
		);
		return normalize(n);
	}

	vec3 trace(vec2 uv){
		for(float t = -1.; t < 1.; t += .1){
			vec3 r = vec3(uv, t);
			if(meta(r, time) <= .05) {
				vec3 n = normal(r);
				float d = dot(normalize(vec3(cos(time),0,-.2)),n);
				float d2 = dot(normalize(vec3(sin(5.+time*.8),cos(5.+time),-.2)),n);
				return vec3(.2,.8,.6)*.3+vec3(.2,.3,.8)*d2+vec3(.7,.0,.3)*pow(d,5.);
			}
		}
		return vec3(0)+vec3(.2,.8,.6)*(1.2/metah(uv.xyy,time));
	}

	void main(void){
		vec2 uv = (2.*fcoord.xy-res)/res.y;
		vec3 f = trace(uv*.8);
		fragColor = vec4(f,1.);
	}

`;

const prog = {
	fs: fs
};

export default prog;