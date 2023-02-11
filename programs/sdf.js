const fs = /*glsl*/`#version 300 es
	precision highp float;
	uniform float time;
	uniform vec2 mouse;
	uniform vec2 resolution;
	out vec4 fragColor;
	#define res resolution
	#define max_steps 20
	#define min_step .01
	#define epsilon .01
	#define dist_margin 1. //.75

	mat3 rot(float t){
		return mat3(cos(t), 0, sin(t), 0, 1, 0, -sin(t), 0, cos(t));
	}

	float smin( float a, float b, float k ){
		float h = max( k-abs(a-b), 0.0 )/k;
		return min( a, b ) - h*h*k*(1.0/4.0);
	}

	float sdBox(vec3 v, vec3 p, float b){
		vec3 d = abs(v-p) - b;
		return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
	}

	float sdf(vec3 v){
		return length(v)-.5;
	}

	float map(vec3 v){
		// return (sdf(v-vec3(-.3))*sdf(v-vec3(cos(time))))-.0;
		vec3 p = vec3(0);
		//p.z = cos(time)+2.;
		v*=rot(time*.3);
		return smin(smin(sdf(v-vec3(-.3)),sdf(v-vec3(cos(time))),.2),
		sdBox(v*rot(time), vec3(0),(cos(sdf(v)+time))),.2);
	}

	// iquilezles.org/articles/normalsSDF
	vec3 normal(vec3 p){
		const float h = 0.0001;
		const vec2 k = vec2(1,-1);
		return normalize(
			k.xyy*map(p + k.xyy*h)+
			k.yyx*map(p + k.yyx*h)+
			k.yxy*map(p + k.yxy*h)+
			k.xxx*map(p + k.xxx*h));
	}

	vec3 light(vec3 p, vec3 l, vec3 c, float a){
		float _l = max(dot(normalize(l),normal(p)),.1);
		return pow(_l,a)*c;
	}

	vec3 lights(vec3 r){
		vec3 lv = vec3(-.3+cos(time),.3,-.3);
		vec3 lv2 = vec3(.2, cos(time*.6),-.3);
		vec3 lc = vec3(1,.3,.5);
		vec3 lc2 = vec3(.3,.7,.9);
		vec3 l = light(r,lv,lc, 1.);
		vec3 l2 = light(r,lv2,lc2, 4.);
		return vec3(.2,0,.6)*.3+.7*(l+l2);
	}

	vec3 trace(vec3 o, vec3 d){
		float t = .5;
		float alpha = 0.;
		for(int i = 0; i < max_steps; i++){
			vec3 r = o+d*t;
			float dist = map(r);
			if(dist < epsilon){
				return lights(r);
			}
			t+= dist*dist_margin;
		}
		return vec3(0);
	}

	float grid(vec2 v, float a){
		return clamp(dot(step(fract(v*a),vec2(.01)),vec2(1)),0.,1.);
	}

	void main(void){
		vec2 uv = (2.*gl_FragCoord.xy-res)/res.y;
		vec3 dir = normalize(vec3(uv, 1));
		vec3 pos = vec3((mouse-.5)*3.,-2.2);
		vec3 c = trace(pos, dir);
		// c += grid(uv,4.)*vec3(0,.4,0);
		fragColor = vec4(c,1);

	}

`;

const prog = {
	fs: fs
};

export default prog;