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
 
try {
  // Channel resmi NCT DREAM, bukan channel pemilik MV.
  const CHANNEL_ID = "UCXURHJRGr4-EB3l87kcbElw";
  const UPLOADS_ID = "UU" + CHANNEL_ID.slice(2);

  const list = await yt(
    `playlistItems?part=contentDetails&playlistId=${UPLOADS_ID}&maxResults=40`
  );

  const ids = (list.items || [])
    .map(x => x.contentDetails.videoId);

  const det = ids.length
    ? await yt(
        `videos?part=snippet,liveStreamingDetails,contentDetails&id=${ids.join(",")}`
      )
    : { items: [] };

  const since = Date.now() - 14 * 864e5;
  const now = new Date().toISOString();

  const durationSeconds = iso => {
    const m = iso?.match(
      /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    );
    if (!m) return 0;
    return Number(m[1] || 0) * 3600 +
      Number(m[2] || 0) * 60 +
      Number(m[3] || 0);
  };

  const events = (det.items || []).flatMap(x => {
    const live = x.liveStreamingDetails;
    const start = live?.scheduledStartTime || x.snippet.publishedAt;

    if (new Date(start).getTime() < since) return [];

    const title = x.snippet.title || "";
    const description = x.snippet.description || "";
    const duration = durationSeconds(x.contentDetails?.duration);

    // Keluarkan video pendek (maksimal 3 menit)
    // dan video yang diberi penanda Shorts.
    const isShort =
      duration > 0 &&
      duration <= 180 ||
      /#shorts\b/i.test(title + " " + description);

    if (isShort) return [];

    return [{
      slug: "yt-" + x.id,
      type: live ? "Live broadcast" : "Official content",
      title,
      start,
      all_day: false,
      note: "",
      source: "YouTube NCT DREAM (otomatis)",
      url: "https://youtu.be/" + x.id,
      verified_at: now
    }];
  });

  await writeFile(
    "data/youtube-events.json",
    JSON.stringify({ updated_at: now, events })
  );

  console.log("events", events.length);
} catch (e) {
  console.error("sync konten gagal:", e.message);
}
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

 // ---- notifikasi OneSignal ----
try {
  const AID = process.env.ONESIGNAL_APP_ID;
  const AK = process.env.ONESIGNAL_API_KEY;

  if (AID && AK) {
    const vw = await readJson("data/views.json", { snapshots: [] });
    const seed = await readJson("data/seed.json", {});
    const ev = await readJson("data/youtube-events.json", { events: [] });

    const views = vw.snapshots.at(-1)?.views || 0;

    // Gunakan salinan status agar status lama tidak berubah
    // sebelum seluruh pengiriman berhasil.
    const notifyState = structuredClone(vw.notify || {});

    const list = buildNotifications({
      views,
      seed,
      ytEvents: ev.events,
      meta: ev.meta || meta,
      state: notifyState,
      site: process.env.SITE_URL || ""
    });

    const n = await sendAll(list, {
      appId: AID,
      apiKey: AK
    });

    // Simpan status hanya setelah seluruh pengiriman berhasil.
    vw.notify = notifyState;
    await writeFile("data/views.json", JSON.stringify(vw));

    console.log("Notifikasi terkirim", n, "/", list.length);
  } else {
    console.log("Notifikasi dilewati (OneSignal belum diisi)");
  }
} catch (e) {
  console.error("NOTIFIKASI GAGAL:", e.message);
  failed = true;
}

process.exit(failed ? 1 : 0);
