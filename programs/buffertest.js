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
    vec2 uv = gl_FragCoord.xy/resolution.xy*3.;

    float t = time*.8;
    
    float diff= .5+sin(t)*8.;

    vec2 b0 = vec2(bnc(t*0.04), 4.*bnc(t*.011));
    vec2 b1 = vec2(bnc(2.+t*.013), bnc(2.+t*.09));
    
    float a = ll(uv, b0, b1, t, 1., 1.2);
    float a2 = ll(uv+.4, b0, b1, t, 15., 1.);
    float a3 = ll(uv-.24, b0, b1, t, 16., 1.);
    
    float f = (a2- diff*a +a3)/.4;
    
    float c = (.3-(5.*f));
    
    vec3 cc = vec3(1.-c*c);
    
    cc /= mix(cc, 2./texture(backbuffer, .99*gl_FragCoord.xy/resolution.xy).xyz, .3)*(.5+.5*cos(.001*uv.xyx*time*vec3(1.,2.,3.)));

    fragColor = vec4(1.-cc,1.0);
}
`;

const mainimg = /*glsl*/`#version 300 es 
precision highp float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
out vec4 fragColor;
uniform sampler2D bufferA;
void main(){
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = gl_FragCoord.xy/resolution.xy;

    // Time varying pixel color
    vec3 col = 0.5 + 0.5*cos(time+uv.xyx+vec3(0,2,4));

    // Output to screen
    // fragColor = vec4(texture(bufferA, uv).xyz*col,1.0);
    fragColor = vec4(col,1.0);
}
`;

const img = {

    fs: mainimg,
    uniforms: {
        bufferA: 0
    }

};

const buffA = {
    fs: buff,
    targets: {
        texture: true,
        renderbuffer: true
    },
    chain: [img]

};

const prog = {

}

export default prog;