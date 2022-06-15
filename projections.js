"use strict";

var last_ts;
var ix,next_ix,t,theta_x,theta_y;

const t_transition=30.0; //temps entre deux transitions (en secondes)
const rot_speed_x=0.019,rot_speed_y=0.013; //vitesses de rotation du globe (altitude et azimut)
const scale_factor=0.85; //proportion de la page occupée par le globe (entre 0 et 1)

const projections = [d3.geoPolyconicRaw,d3.geoBonneRaw(Math.PI / 4),d3.geoFoucautRaw,d3.geoBonneRaw(Math.PI / 2)];
var canvas,context,texture;

const outline = ({type: "Sphere"});
const lerp1=(x0, x1, t)=>{return (1 - t) * x0 + t * x1;};
const lerp2=([x0, y0], [x1, y1], t) =>{return [(1 - t) * x0 + t * x1, (1 - t) * y0 + t * y1];};
const rot_angle=(tx,ty)=>{return [360*tx,360*ty];};
const get_next_ix=(ix)=>{
  var n_ix=Math.floor(projections.length*Math.random());
  while(ix==n_ix)n_ix=Math.floor(projections.length*Math.random());
  return n_ix;
}
const land = topojson.feature(world, world.objects.land);

function init() {
  canvas=document.createElement("canvas");
  canvas.id="canvas";
  canvas.innerText="Please update your browser ;)"
  canvas.style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;"
  document.body.appendChild(canvas);
  context=canvas.getContext("2d");
  resizeCanvas();
  const bg_img=document.getElementById("bg");
  texture=context.createPattern(bg_img, "repeat");
  ix=Math.floor(projections.length*Math.random());
  next_ix=get_next_ix(ix);
  t=theta_x=theta_y=0.0;
  last_ts=0;
  update();
}

function resizeCanvas() {
  canvas.width = Math.ceil(scale_factor*window.innerWidth);
  canvas.height = Math.ceil(scale_factor*window.innerHeight);
  context.width = canvas.width;
  context.height = canvas.height;
}

function fit(raw) {
  const p = d3.geoProjection(raw).fitExtent(
    [
      [0.5, 0.5],
      [context.width - 0.5, context.height - 0.5],
    ],
    outline
  );
  return { scale: p.scale(), translate: p.translate() };
}

function lerp_projection(raw0, raw1) {
  const { scale: scale0, translate: translate0 } = fit(raw0);
  const { scale: scale1, translate: translate1 } = fit(raw1);
  return (t) =>
    d3
      .geoProjection((x, y) => lerp2(raw0(x, y), raw1(x, y), t))
      .scale(lerp1(scale0, scale1, t))
      .translate(lerp2(translate0, translate1, t))
      .precision(0.1);
}

function update(ts=0) {
    const dt=(ts-last_ts)/1000;
    const proj=lerp_projection(projections[ix],projections[next_ix])(t/t_transition);
    t+=dt;
    last_ts=ts
    render(proj.rotate(rot_angle(theta_x,theta_y)));
    theta_x=theta_x+dt*rot_speed_x;
    theta_y=theta_y+dt*rot_speed_y;
    if (t>t_transition){
        ix=next_ix;
        next_ix=get_next_ix(ix);
        t%=t_transition;
    }
    if(theta_x>1)theta_x%=1;
    if(theta_y>1)theta_y%=1;
  requestAnimationFrame(update);
}

function render(projection) {
  const path = d3.geoPath(
    projection,
    context
  );
  (context.fillStyle = "#000"),
    context.fillRect(0, 0, context.width, context.height);
  context.beginPath(),
    path(land),
    (context.fillStyle = texture),
    context.fill();
  context.restore();
}