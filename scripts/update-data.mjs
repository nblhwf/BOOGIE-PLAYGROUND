// Dijalankan GitHub Actions tiap 15 menit. Tanpa dependency (Node 20).
// Menulis data/views.json (riwayat views MV) dan data/youtube-events.json (konten channel NCT DREAM).
import {readFile,writeFile} from "node:fs/promises";
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
    const ch="UCXURHJRGr4-EB3l87kcbElw",list=await yt(`playlistItems?part=contentDetails&playlistId=UU${ch.slice(2)}&maxResults=40`);
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
process.exit(failed?1:0);
