"use strict";

var ix,next_ix,t,theta_x,theta_y;

const t_transition=20.0; //temps entre deux transitions (en secondes)
const rot_speed_x=0.03,rot_speed_y=0.02; //vitesses de rotation du globe (altitude et azimut)
const scale_factor=0.85; //proportion de la page occupée par le globe (entre 0 et 1)

const fps=40;
const dt=1/fps;
const delay=Math.ceil(1000*dt)

const projections = [d3.geoPolyconicRaw,d3.geoBonneRaw(Math.PI / 4),d3.geoFoucautRaw,d3.geoBonneRaw(Math.PI / 2)];
var canvas,context,bg_img,texture;

const outline = ({type: "Sphere"});
const lerp1=(x0, x1, t)=>{return (1 - t) * x0 + t * x1;};
const lerp2=([x0, y0], [x1, y1], t) =>{return [(1 - t) * x0 + t * x1, (1 - t) * y0 + t * y1];};
const rot_angle=(tx,ty)=>{return [360*tx,360*ty];};
const land = topojson.feature(world, world.objects.land);

function init() {
  canvas=document.createElement("canvas");
  canvas.id="canvas";
  canvas.innerText="Please update your browser ;)"
  canvas.style="position: absolute;top:0;bottom: 0;left: 0;right: 0;margin:auto;"
  document.body.appendChild(canvas);
  context=canvas.getContext("2d");
  resizeCanvas();

  bg_img = document.createElement("img");
  bg_img.src = "https://i.postimg.cc/bw91Wxcp/fleur.jpg";

  texture=context.createPattern(bg_img, "repeat");

  ix=0;
  next_ix=1;
  t=theta_x=theta_y=0.0;
  setInterval(update,delay)
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



function update() {
    const proj=lerp_projection(projections[ix],projections[next_ix])(t/t_transition);
    render(proj.rotate(rot_angle(theta_x,theta_y)));
    t+=dt;
    theta_x=(theta_x+dt*rot_speed_x)%(1.0);
    theta_y=(theta_y+dt*rot_speed_y)%(1.0);
    if (t>t_transition){
        ix=next_ix;
        next_ix=(next_ix+1)%projections.length;
        t-=t_transition;
    }
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