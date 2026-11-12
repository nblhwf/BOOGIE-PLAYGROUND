
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

const addDays = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const dateLabel = date => date.split("-").reverse().join("/");

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
  const tomorrow = addDays(today, 1);

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
  } else {
    const previous = st.last_million || 0;

    if (mil > previous) {
      for (let i = previous + 1; i <= mil; i++) {
        out.push({
          key: "m:" + i,
          heading: "🎉 MILESTONE UNLOCKED!",
          body: `NCT DREAM's MV has reached ${nf(i * 1e6)} views!\nLet's keep streaming, NCTzen! 🤍`,
          url: site
        });
      }

      st.last_million = mil;
    }
  }

  // 2. Konten YouTube baru.
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

  // 3. Pengingat jadwal: sehari sebelum dan hari H.
  if (hour >= 8) {
    const schedules = (seed.events || [])
      .filter(e => {
        if (!e.verified_at || !e.start) return false;

        const date = ymd(e.start);
        return date === today || date === tomorrow;
      });

    if (schedules.length) {
      const lines = schedules.map(e => {
        const date = ymd(e.start);
        const label = date === today ? "TODAY" : "TOMORROW";
        const when = e.all_day
          ? "All day"
          : fmtTime(e.start) + " WIB";

        return `${label} (${dateLabel(date)})\n${e.title} — ${when}`;
      });

      push(
        "schedule:" + today,
        "📅 NCT DREAM SCHEDULE",
        lines.join("\n\n") + "\n\nDon't miss it, NCTzen! 🤍",
        site,
        true
      );
    }

    // 4. Pengingat voting: setiap hari selama voting aktif.
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
        "vote:" + today,
        "🗳️ DAILY VOTE REMINDER!",
        open.map(v =>
          `${v.show} — ${v.phase}\n${v.apps.join(" & ")}\nUntil ${v.end_date}`
        ).join("\n\n") +
        "\n\nDon't forget to vote, NCTzen! 🤍",
        open.length === 1 ? (open[0].url || site) : site,
        true
      );
    }
  }

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

    const responseText = await r.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      result = { raw: responseText };
    }

    console.log("Respons OneSignal:", m.key, JSON.stringify(result));

    if (!r.ok || result.errors) {
      throw new Error(
        `OneSignal ${r.status}: ${JSON.stringify(result)}`
      );
    }

    n++;
    console.log("Notifikasi berhasil dikirim:", m.key);
  }

  return n;
}

