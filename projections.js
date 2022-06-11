var ix = 0;
var next_ix=1;
const t_transition=10.0;
var t=0.0;
const fps=30;
const dt=1/fps;
const delay=Math.ceil(1000*dt);
const rot_speed_x=0.05;
const rot_speed_y=0.03;
var theta_x=0.0,theta_y=0.0;
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var land_img = document.createElement("img");
land_img.src = "https://i.postimg.cc/bw91Wxcp/fleur.jpg";
const land_texture = context.createPattern(land_img, "repeat");
const projections = [d3.geoPolyconicRaw,d3.geoBonneRaw(Math.PI / 4),d3.geoFoucautRaw,d3.geoBonneRaw(Math.PI / 2)];
outline = ({type: "Sphere"});
const lerp1=(x0, x1, t)=>{return (1 - t) * x0 + t * x1;};
const lerp2=([x0, y0], [x1, y1], t) =>{return [(1 - t) * x0 + t * x1, (1 - t) * y0 + t * y1];};
const rot_angle=(tx,ty)=>{return [360*tx,360*ty];};
const land = topojson.feature(world, world.objects.land);
init();

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  context.width = window.innerWidth;
  context.height = window.innerHeight;
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

function init() {
    resizeCanvas();
    const frame_delay=40;
    setInterval(update,frame_delay)
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
    (context.fillStyle = land_texture),
    context.fill();
  context.restore();
}
ease = d3.easeCubicInOut;
