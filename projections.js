var ix = 0;
var next_ix=1;
var step_n=0;
const n_transition_steps = 360;
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var land_img = document.createElement("img");
land_img.src = "https://i.postimg.cc/bw91Wxcp/fleur.jpg";
const land_texture = context.createPattern(land_img, "repeat");
const projections = [d3.geoPolyconicRaw,d3.geoBonneRaw(Math.PI / 4),d3.geoFoucautRaw,d3.geoBonneRaw(Math.PI / 2)];
outline = ({type: "Sphere"});
const lerp1=(x0, x1, t)=>{return (1 - t) * x0 + t * x1;};
const lerp2=([x0, y0], [x1, y1], t) =>{return [(1 - t) * x0 + t * x1, (1 - t) * y0 + t * y1];};
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

function interpolateProjection(raw0, raw1) {
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
    const t=step_n/n_transition_steps;
    const proj=interpolateProjection(projections[ix],projections[next_ix])(t);
    render(proj.rotate([step_n,step_n]));
    step_n++;
    if (step_n%n_transition_steps==0){
        step_n=0;
        ix=next_ix;
        next_ix=(next_ix+1)%projections.length;
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
