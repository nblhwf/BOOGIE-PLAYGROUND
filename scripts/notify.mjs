
// Logika notifikasi BOOGIE! PLAYGROUND (OneSignal)
const WIB = d => new Date(new Date(d).getTime() + 7 * 36e5);
const ymd = d => WIB(d).toISOString().slice(0, 10);

const fmtTime = d => {
  const w = WIB(d);
  const h = w.getUTCHours();
  const m = String(w.getUTCMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
};

const nf = n => Number(n).toLocaleString("en-US");

export function buildNotifications({
  views,
  seed,
  ytEvents,
  meta,
  state,
  now = new Date(),
  site = ""
}) {
  const out = [];
  const st = state;
  const sent = new Set(st.sent || []);
  const M = meta || {};

  const first = !st.init;
  const hour = WIB(now).getUTCHours();
  const today = ymd(now);

  // Tambahkan notifikasi ke daftar.
  // allowFirst = true berarti boleh dikirim pada pemeriksaan pertama.
  const push = (key, heading, body, url, allowFirst = false) => {
    if (sent.has(key)) return;

    sent.add(key);

    if (!first || allowFirst) {
      out.push({
        key,
        heading,
        body,
        url: url || site
      });
    }
  };

  // 1. Milestone setiap 1 juta views.
  const mil = Math.floor((views || 0) / 1e6);

  if (first) {
    st.last_million = mil;
  } else if (mil > (st.last_million || 0)) {
    const v = mil * 1e6;

    out.push({
      key: "m:" + mil,
      heading: "🎉 MILESTONE UNLOCKED!",
      body: `NCT DREAM's MV has reached ${nf(v)} views!\nLet's keep streaming, NCTzen! 🤍`,
      url: site
    });

    st.last_million = mil;
  }

  // 2. Konten baru.
  // Konten lama dicatat pada pemeriksaan pertama,
  // tetapi tidak dikirim sebagai notifikasi baru.
  const ids = [
    ...(seed.content || []).map(c => c.id),
    ...(ytEvents || [])
      .filter(e => /^yt-/.test(e.slug))
      .map(e => e.slug.slice(3))
  ];

  for (const id of new Set(ids)) {
    const t =
      M[id]?.title ||
      (seed.content || []).find(c => c.id === id)?.title ||
      (ytEvents || []).find(e => e.slug === "yt-" + id)?.title ||
      "New content";

    push(
      "new:" + id,
      "🎬 NEW CONTENT!",
      `${t}\nWatch now, NCTzen! 🤍`,
      "https://youtu.be/" + id
    );
  }

  // 3. Jadwal hari ini.
  // 4. Pengingat vote aktif.
  // Bisa dikirim pada pemeriksaan pertama setelah pukul 08.00 WIB.
  if (hour >= 8) {
    for (const e of seed.events || []) {
      if (!e.verified_at || !e.start) continue;
      if (ymd(e.start) !== today) continue;

      const when = e.all_day
        ? "All day"
        : fmtTime(e.start) + " WIB";

      push(
        `s:${e.slug}:${today}`,
        "📅 TODAY'S SCHEDULE",
        `NCT DREAM has an upcoming schedule today!\n${e.title} — ${when}\nDon't miss it, NCTzen! 🤍`,
        site,
        true
      );
    }

    const open = (seed.votes || []).filter(v =>
      v.verified_at &&
      v.start_date &&
      v.end_date &&
      today >= v.start_date &&
      today <= v.end_date &&
      !v.result
    );

    if (open.length) {
      push(
        "v:" + today,
        "🗳️ VOTE REMINDER!",
        open
          .map(v =>
            `${v.show} — ${v.phase} on ${v.apps.join(" & ")} (until ${v.end_date})`
          )
          .join("\n") +
          "\nDon't forget to vote, NCTzen! 🤍",
        open.length === 1 ? (open[0].url || site) : site,
        true
      );
    }
  }

  // Simpan status pemeriksaan.
  st.init = true;
  st.sent = [...sent].slice(-300);

  return out;
}

// 5. Kirim notifikasi melalui OneSignal.
export async function sendAll(
  list,
  { appId, apiKey, fetchFn = fetch }
) {
  let n = 0;

  for (const m of list) {
    const r = await fetchFn(
      "https://api.onesignal.com/notifications?c=push",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Key " + apiKey
        },
        body: JSON.stringify({
          app_id: appId,
          target_channel: "push",
          included_segments: ["Subscribed Users"],
          headings: { en: m.heading },
          contents: { en: m.body },
          url: m.url || undefined
        })
      }
    );

    if (!r.ok) {
      const error = (await r.text()).slice(0, 500);
      throw new Error(`OneSignal ${r.status}: ${error}`);
    }

    n++;
    console.log("Notifikasi berhasil dikirim:", m.key);
  }

  return n;
}
