// Simulate reform fatigue effect: run the reformer path through a JS replica
// of the in-page applyEffects + fatigue logic to verify the compounding is capped.
const clamp=(v)=>Math.max(0,Math.min(100,v));
function applyDelta(m,k,v){
  let next=m[k]+v;
  if(v<0&&next<20){const o=20-Math.max(next,5);next=next<5?5:20-o/2;}
  m[k]=clamp(Math.round(next*10)/10);
}
const sig=(e)=>['rights','social','enviro'].filter(k=>(e[k]||0)>0).length>=2&&Object.keys(e).length>=3;
const mult=(n)=>n<3?1:n<6?0.75:n<10?0.5:0.35;
let m={unity:50,economy:50,rights:50,enviro:50,sovereign:50,social:50},fat=0;
import{readFileSync}from'node:fs';const d=JSON.parse(readFileSync('game_data.json'));
for(const dec of d){
  let b=0,bs=-1e9;dec.choices.forEach((c,i)=>{const e=c.effects||{};const s=(e.rights||0)+(e.social||0)+(e.enviro||0);if(s>bs){bs=s;b=i;}});
  let eff={...(dec.choices[b].effects||{})};
  if(sig(eff)){
    const mu=mult(fat);fat++;
    if(mu<1)for(const[k,v]of Object.entries(eff))if(v>0)eff[k]=Math.max(1,Math.round(v*mu));
    if(fat>=6+3-3)/*n>=6*/if((fat-1)>=6)eff.economy=Math.min(eff.economy??0,-2);
    if((fat-1)>=10)eff.approval=(eff.approval??0)-2;
  } else fat=Math.max(0,fat-1);
  for(const[k,v]of Object.entries(eff))if(k!=='approval')applyDelta(m,k,v);
}
console.log('reformer WITH fatigue:',JSON.stringify(Object.fromEntries(Object.entries(m).map(([k,v])=>[k,Math.round(v)]))));
console.log('score:',Math.round(Object.entries(m).filter(([k])=>k!=='approval').reduce((a,[,v])=>a+v,0)/6*10)/10);
