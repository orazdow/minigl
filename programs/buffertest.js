const buff = /*glsl*/`#version 300 es 

precision highp float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
out vec4 fragColor;
uniform sampler2D backbuffer;

float ll(vec2 uv, vec2 c0, vec2 c1, float t, float f, float a){
    return log(.001+(cos(t+length(uv-c0)*f)+1.)*(cos(t+length(uv-c1)*f)+1.))*0.01*a;
}

float bnc(float t){
    return abs(fract(t)-0.5)*2.;
}

void main(){
    vec2 uv = gl_FragCoord.xy/resolution.xy*3.2;
    float t = time*.8;

    float diff= .5+sin(t)*8.;
    vec2 b0 = vec2(bnc(t*0.04), 4.*bnc(t*.011));
    vec2 b1 = vec2(bnc(2.+t*.013), bnc(2.+t*.09));

    float a = ll(uv, b0, b1, t, 1., 1.2);
    float a2 = ll(uv+.4, b0, b1, t, 15., 1.);
    float a3 = ll(uv-.24, b0, b1, t, 16., 1.);
    
    float f = (a2- diff*a +a3)/.4;
    float c = (.3-(8.*f));
    vec3 cc = vec3(1.-c*c);
    vec3 col = 0.5 + 0.5*cos(time+uv.xyx+vec3(0,2,4));  
    vec3 b = mix(cc, 1./texture(backbuffer, .992*gl_FragCoord.xy/resolution.xy).xyz, .3); 
    cc /= b;    
    fragColor = vec4(col*(.9-cc), 1.0 );
}
`;

const pgm = {
    fs: buff,
    targets: {
        texture: true,
        renderbuffer: true
    }
};

export default pgm;