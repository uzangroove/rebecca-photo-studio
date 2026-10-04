import {test} from "node:test";
import assert from "node:assert/strict";
import {alignBox,boxFromCenter,centerFocal,centerFromBox,coverBox,distribute,focalFromBox,imageBox,imageGeometryFromBox,nudgeCenter,
  pctToPx,productAreaBox,pxToPct,roundShown,roundStored,snapBox,snapTargets,SAFE_MARGIN_PCT,type Box} from "../shared/brand-geometry.ts";
import {formats} from "../shared/social-formats.ts";

const close=(a:number,b:number,eps=0.01,msg="")=>assert.ok(Math.abs(a-b)<=eps,`${msg} ${a} vs ${b}`);
const canvasOf=(f:{width:number;height:number})=>({w:f.width,h:f.height});

test("percent and pixels convert both ways in every format",()=>{
  assert.equal(formats.length,16);
  for(const f of formats){
    const c=canvasOf(f);
    for(const px of [0,1,7,c.w/3,c.w/2,c.w-1,c.w]){close(pctToPx(pxToPct(px,c.w),c.w),px,1e-9,`${f.id} x`)}
    for(const px of [0,1,7,c.h/3,c.h/2,c.h-1,c.h]){close(pctToPx(pxToPct(px,c.h),c.h),px,1e-9,`${f.id} y`)}
    assert.equal(pctToPx(50,c.w),c.w/2);assert.equal(pctToPx(100,c.h),c.h);assert.equal(pxToPct(c.w,c.w),100);
  }
});
test("a box survives the trip through stored percentages with sub-pixel error, in every format",()=>{
  for(const f of formats){
    const c=canvasOf(f),box:Box={x:c.w*0.137,y:c.h*0.291,w:c.w*0.402,h:c.h*0.083};
    const center=centerFromBox(box,c),back=boxFromCenter(center.cx,center.cy,box.w,box.h,c);
    close(back.x,box.x,0.01,f.id);close(back.y,box.y,0.01,f.id);
  }
});
test("an image layer keeps width, height and position through percentages, in every format",()=>{
  const aspect=161/799;
  for(const f of formats){
    const c=canvasOf(f),g={cx:50,cy:8.4,w:40.3,stretch:1.25};
    const box=imageBox(g,aspect,c);
    close(box.w,c.w*0.403,1e-6,f.id);close(box.h,box.w*aspect*1.25,1e-6,f.id);
    close(box.x+box.w/2,c.w/2,1e-6,f.id);close(box.y+box.h/2,c.h*0.084,1e-6,f.id);
    const back=imageGeometryFromBox(box,aspect,c);
    close(back.cx,g.cx,0.001);close(back.cy,g.cy,0.001);close(back.w,g.w,0.001);close(back.stretch,g.stretch,0.001);
  }
});
test("percent fields keep one decimal on screen but full precision in storage",()=>{
  assert.equal(roundShown(8.449),8.4);assert.equal(roundShown(8.45),8.5);assert.equal(roundShown(50),50);
  assert.equal(roundStored(33.33333),33.333);
});
test("arrow keys move exactly one pixel, shift+arrow ten, in every format",()=>{
  for(const f of formats){
    const c=canvasOf(f),start={cx:50,cy:50};
    const right=nudgeCenter(start.cx,start.cy,1,0,c);
    close(pctToPx(right.cx-start.cx,c.w),1,0.01,f.id);assert.equal(right.cy,50);
    const down10=nudgeCenter(start.cx,start.cy,0,10,c);
    close(pctToPx(down10.cy-start.cy,c.h),10,0.01,f.id);
    const left=nudgeCenter(start.cx,start.cy,-1,0,c);
    close(pctToPx(start.cx-left.cx,c.w),1,0.01,f.id);
  }
});
test("nudging stays inside the image",()=>{
  const c={w:1080,h:1350};
  assert.deepEqual(nudgeCenter(100,0,50,-50,c),{cx:100,cy:0});
});
test("the product area is the central 60 percent of every format",()=>{
  for(const f of formats){
    const c=canvasOf(f),p=productAreaBox(c);
    close(p.x,c.w*0.2,1e-6);close(p.w,c.w*0.6,1e-6);close(p.y,c.h*0.2,1e-6);close(p.h,c.h*0.6,1e-6);
  }
});

const ref:Box={x:0,y:0,w:1000,h:2000};
const box:Box={x:100,y:300,w:200,h:50};
test("six alignment actions against the whole image",()=>{
  assert.deepEqual(alignBox(box,ref,"left"),{...box,x:0});
  assert.deepEqual(alignBox(box,ref,"hcenter"),{...box,x:400});
  assert.deepEqual(alignBox(box,ref,"right"),{...box,x:800});
  assert.deepEqual(alignBox(box,ref,"top"),{...box,y:0});
  assert.deepEqual(alignBox(box,ref,"vcenter"),{...box,y:975});
  assert.deepEqual(alignBox(box,ref,"bottom"),{...box,y:1950});
});
test("alignment against another layer and against the product area",()=>{
  const other:Box={x:500,y:600,w:100,h:300};
  assert.deepEqual(alignBox(box,other,"hcenter"),{...box,x:450});
  assert.deepEqual(alignBox(box,other,"bottom"),{...box,y:850});
  assert.deepEqual(alignBox(box,other,"left"),{...box,x:500});
  const product=productAreaBox({w:1000,h:2000});
  assert.deepEqual(alignBox(box,product,"left"),{...box,x:200});
  assert.deepEqual(alignBox(box,product,"right"),{...box,x:600});
  assert.deepEqual(alignBox(box,product,"top"),{...box,y:400});
  assert.deepEqual(alignBox(box,product,"vcenter"),{...box,y:1000-25});
});
test("aligning twice changes nothing, and size is never touched",()=>{
  for(const action of ["left","hcenter","right","top","vcenter","bottom"] as const){
    const once=alignBox(box,ref,action);
    assert.deepEqual(alignBox(once,ref,action),once);
    assert.equal(once.w,box.w);assert.equal(once.h,box.h);
  }
});
test("distribute makes the gaps equal and keeps the outer boxes",()=>{
  const boxes:Box[]=[{x:0,y:0,w:100,h:40},{x:700,y:0,w:100,h:40},{x:150,y:0,w:100,h:40}];
  const out=distribute(boxes,"x");
  assert.equal(out[0].x,0);assert.equal(out[1].x,700);
  assert.equal(out[2].x,350);
  const gap1=out[2].x-(out[0].x+out[0].w),gap2=out[1].x-(out[2].x+out[2].w);
  assert.equal(gap1,gap2);
  assert.notEqual(out,boxes);assert.equal(boxes[2].x,150,"input is not mutated");
});
test("distribute vertically with different heights",()=>{
  const boxes:Box[]=[{x:0,y:0,w:10,h:100},{x:0,y:800,w:10,h:50},{x:0,y:100,w:10,h:200}];
  const out=distribute(boxes,"y");
  const sorted=[...out].sort((a,b)=>a.y-b.y);
  assert.equal(sorted[0].y,0);assert.equal(sorted[2].y,800);
  close(sorted[1].y-(sorted[0].y+sorted[0].h),sorted[2].y-(sorted[1].y+sorted[1].h),1e-9);
});
test("distribute needs at least three boxes",()=>{
  const two:Box[]=[{x:0,y:0,w:10,h:10},{x:50,y:0,w:10,h:10}];
  assert.deepEqual(distribute(two,"x"),two);
});

const canvas={w:1000,h:1000};
test("a dragged box snaps its center to the center of the image",()=>{
  const t=snapTargets(canvas,[]);
  const r=snapBox({x:395,y:300,w:200,h:50},t,8);
  assert.equal(r.box.x,400);assert.equal(r.box.y,300);
  assert.deepEqual(r.guides.x.map(g=>g.kind),["center"]);assert.deepEqual(r.guides.y,[]);
});
test("snapping reaches edges, margins and the product area",()=>{
  const t=snapTargets(canvas,[]);
  assert.equal(snapBox({x:3,y:500,w:100,h:20},t,8).box.x,0);
  const m=canvas.w*SAFE_MARGIN_PCT/100;
  const margin=snapBox({x:m+4,y:500,w:100,h:20},t,8);
  assert.equal(margin.box.x,m);assert.equal(margin.guides.x[0].kind,"margin");
  assert.equal(snapBox({x:100,y:46,w:100,h:20},t,8).box.y,50,"top margin");
  assert.equal(snapBox({x:100,y:931,w:100,h:20},t,8).box.y,930,"bottom edge to the bottom margin");
  assert.equal(snapBox({x:700,y:100,w:97,h:20},t,8).box.x,703,"right edge to the product area");
});
test("a box snaps to the center and edges of another layer",()=>{
  const other:Box={x:600,y:100,w:200,h:100};
  const t=snapTargets(canvas,[other]);
  const r=snapBox({x:660,y:400,w:80,h:20},t,6);
  assert.equal(r.box.x,660,"center 700 matches the other layer center already");
  assert.ok(r.guides.x.some(g=>g.kind==="layer"));
  const edge=snapBox({x:604,y:400,w:80,h:20},t,6);
  assert.equal(edge.box.x,600);
});
test("outside the threshold nothing snaps and no guides show",()=>{
  const t=snapTargets(canvas,[]);
  const box:Box={x:333,y:222,w:100,h:30};
  const r=snapBox(box,t,6);
  assert.deepEqual(r.box,box);assert.deepEqual(r.guides,{x:[],y:[]});
});
test("the nearest line wins when several are in range",()=>{
  const t=snapTargets(canvas,[]);
  const r=snapBox({x:497-100+2,y:0.5,w:200,h:20},t,10);
  assert.equal(r.box.x+100,500);
});
test("manual crop: the image fills the frame and the focal point picks the visible part",()=>{
  const img={w:2000,h:1000},frame={w:1000,h:1000};
  const centered=coverBox(img,frame,centerFocal);
  assert.deepEqual(centered,{x:-500,y:0,w:2000,h:1000});
  assert.equal(coverBox(img,frame,{x:0,y:0.5}).x,0);
  assert.equal(coverBox(img,frame,{x:1,y:0.5}).x,-1000);
  assert.deepEqual(focalFromBox({x:-250,y:0,w:2000,h:1000},frame),{x:0.25,y:0.5});
  const tall=coverBox({w:1000,h:2000},frame,{x:0.5,y:0.2});
  assert.equal(tall.w,1000);assert.equal(tall.y,-200);
});
test("manual crop works for every format and keeps the frame covered",()=>{
  for(const f of formats)for(const focal of [{x:0,y:0},{x:0.3,y:0.8},{x:1,y:1}]){
    const c=canvasOf(f),b=coverBox({w:1024,h:1536},c,focal);
    assert.ok(b.x<=1e-9&&b.y<=1e-9&&b.x+b.w>=c.w-1e-9&&b.y+b.h>=c.h-1e-9,f.id);
    const back=focalFromBox(b,c);
    close(back.x,b.w-c.w>0.0001?focal.x:0.5,1e-9);close(back.y,b.h-c.h>0.0001?focal.y:0.5,1e-9);
  }
});
