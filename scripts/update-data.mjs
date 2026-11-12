// Dijalankan GitHub Actions tiap 15 menit. Tanpa dependency (Node 20).
// Menulis data/views.json (riwayat views MV) dan data/youtube-events.json (konten channel NCT DREAM).
import {readFile,writeFile} from "node:fs/promises";
import {buildNotifications,sendAll} from "./notify.mjs";
const KEY=process.env.YT_API_KEY, VID=process.env.VIDEO_ID||"wG7pnZttup8", API="https://www.googleapis.com/youtube/v3";
if(!KEY){console.error("YT_API_KEY belum diisi di GitHub Secrets");process.exit(1)}
const yt=async p=>{const r=await fetch(`${API}/${p}&key=${KEY}`);if(!r.ok)throw new Error(`YouTube ${r.status}: ${(await r.text()).slice(0,200)}`);return r.json()};
const readJson=async(f,d)=>{try{return JSON.parse(await readFile(f,"utf8"))}catch{return d}};
let failed=false;
try{
  const j=await yt(`videos?part=statistics,snippet&id=${VID}`),it=j.items?.[0];
  if(!it)throw new Error("Video tidak ditemukan");
  const f="data/views.json",d=await readJson(f,{snapshots:[]});
  d.snapshots.push({captured_at:new Date().toISOString(),views:Number(it.statistics.viewCount)});
  d.snapshots=d.snapshots.slice(-6000);d.video_id=VID;d.updated_at=new Date().toISOString();
  await writeFile(f,JSON.stringify(d));console.log("views",it.statistics.viewCount);
  try{
    const ch=it.snippet.channelId,list=await yt(`playlistItems?part=contentDetails&playlistId=UU${ch.slice(2)}&maxResults=40`);
    const ids=(list.items||[]).map(x=>x.contentDetails.videoId);
    const det=ids.length?await yt(`videos?part=snippet,liveStreamingDetails&id=${ids.join(",")}`):{items:[]};
    const since=Date.now()-14*864e5,now=new Date().toISOString();
    const events=(det.items||[]).flatMap(x=>{
      const start=x.liveStreamingDetails?.scheduledStartTime||x.snippet.publishedAt;
      if(new Date(start).getTime()<since)return [];
      return [{slug:"yt-"+x.id,type:x.liveStreamingDetails?"Live broadcast":"Official content",title:x.snippet.title,start,all_day:false,
        note:"",source:"YouTube NCT DREAM (otomatis)",url:"https://youtu.be/"+x.id,verified_at:now}];
    });
    await writeFile("data/youtube-events.json",JSON.stringify({updated_at:now,events}));console.log("events",events.length);
  }catch(e){console.error("sync konten gagal:",e.message)}
}catch(e){console.error(e.message);failed=true}
// ---- metadata judul & tanggal untuk konten (urutan terbaru dulu di web) ----
let meta={};
try{
  const seed=await readJson("data/seed.json",{content:[]});
  const prev=await readJson("data/youtube-events.json",{events:[]});
  const ids=[...new Set([...(seed.content||[]).map(c=>c.id),...(prev.events||[]).filter(e=>/^yt-/.test(e.slug)).map(e=>e.slug.slice(3))])];
  for(let i=0;i<ids.length;i+=50){const r=await yt(`videos?part=snippet&id=${ids.slice(i,i+50).join(",")}`);
    for(const x of r.items||[])meta[x.id]={title:x.snippet.title,published_at:x.snippet.publishedAt,channel:x.snippet.channelTitle}}
  prev.meta=meta;await writeFile("data/youtube-events.json",JSON.stringify(prev));console.log("meta",Object.keys(meta).length);
}catch(e){console.error("meta gagal:",e.message)}
// ---- notifikasi (hanya jika ONESIGNAL_APP_ID & ONESIGNAL_API_KEY diisi) ----
try{
  const AID=process.env.ONESIGNAL_APP_ID,AK=process.env.ONESIGNAL_API_KEY;
  if(AID&&AK){
    const vw=await readJson("data/views.json",{snapshots:[]}),seed=await readJson("data/seed.json",{}),ev=await readJson("data/youtube-events.json",{events:[]});
    const views=vw.snapshots.at(-1)?.views||0;vw.notify=vw.notify||{};
    const list=buildNotifications({views,seed,ytEvents:ev.events,meta:ev.meta||meta,state:vw.notify,site:process.env.SITE_URL||""});
    const n=await sendAll(list,{appId:AID,apiKey:AK});
    await writeFile("data/views.json",JSON.stringify(vw));console.log("notifikasi terkirim",n,"/",list.length);
  }else console.log("notifikasi dilewati (OneSignal belum diisi)");
}catch(e){console.error("notifikasi gagal:",e.message)}
process.exit(failed?1:0);
