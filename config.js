/* ============================================================
   BOOGIE! PLAYGROUND — config.js
   File pengaturan utama. Edit di sini untuk link, target, dan foto.
   ============================================================ */
window.CFG = {
  // --- Supabase (OPSIONAL). Hanya perlu kalau mau ranking rating antar-pengunjung.
  //     Views, jadwal, dan voting tetap jalan tanpa Supabase (lihat README).
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Folder data. Biarkan "data/" kecuali kamu memindahkannya.
  DATA_BASE: "data/",

  // --- MV & album
  VIDEO_ID: "wG7pnZttup8",
  ALBUM: "DREAM AFTER DREAM",
  TITLE_TRACK: "Boogie Woogie",
  RELEASE_AT: "2026-11-09T16:00:00+07:00",   // MV rilis 16.00 WIB (18.00 KST)
  TARGET_VIEWS: 10_000_000,                    // ubah sesuai target fandom
  MILESTONES: [1e6, 5e6, 10e6, 25e6, 50e6, 100e6],
  DEFAULT_TZ: "Asia/Jakarta",

  // --- Tracklist DREAM AFTER DREAM
  TRACKLIST: ["The Sun","Boogie Woogie","Smile for U","Tumbler","Skydive","This Is Your World","Cool for Me","Pressure","Watch U Watch Me","Dream After Dream"],

  // --- Foto "Comeback moments" di Home. Tambah foto baru: simpan di assets/photos/, lalu tambah satu baris.
  MOMENTS: [
    {src:"assets/photos/m01.jpg", cap:""},
    {src:"assets/photos/m02.jpg", cap:""},
    {src:"assets/photos/m03.jpg", cap:""},
    {src:"assets/photos/m04.jpg", cap:""},
    {src:"assets/photos/m05.jpg", cap:""},
    {src:"assets/photos/m06.jpg", cap:""},
    {src:"assets/photos/m07.jpg", cap:""},
    {src:"assets/photos/m08.jpg", cap:""},
    {src:"assets/photos/m09.jpg", cap:""},
    {src:"assets/photos/m10.jpg", cap:""},
    {src:"assets/photos/m11.jpg", cap:""}
  ],

  // --- Streaming directory. "img" = gambar cover dari platform masing-masing.
  // url kosong = tombol tampil "Link menyusul".
  STREAMING: [
    {name:"YouTube", ic:"YT", color:"#d62f5c", note:"Official MV", url:"https://youtu.be/wG7pnZttup8",
      img:"https://i.ytimg.com/vi/wG7pnZttup8/maxresdefault.jpg"},
    {name:"Spotify", ic:"SP", color:"#1b8f96", note:"Album DREAM AFTER DREAM",
      url:"https://open.spotify.com/album/4ZOny2sfAeGeHixBa8UXcw?si=NfbroBqxQVSOXuLf292IfQ",
      img:"https://i.scdn.co/image/ab67616d0000b273c4ed63d770ce49a173ba328d"},
    {name:"Apple Music", ic:"AM", color:"#2a7ea6", note:"Boogie Woogie",
      url:"https://music.apple.com/id/album/boogie-woogie/6827483714?i=6827483717",
      img:"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/9a/12/b9/9a12b999-8abc-b0c2-ba6e-7729562eaab6/888735957383.png/600x600bb.jpg"},
    {name:"Melon", ic:"ME", color:"#ec5a2c", note:"Album DREAM AFTER DREAM", url:"https://www.melon.com/album/detail.htm?albumId=15004542",
      img:"https://i.scdn.co/image/ab67616d0000b273c4ed63d770ce49a173ba328d"}
  ],

  // --- Voting directory.
  // site = situs resmi, ios = halaman App Store, play = kata kunci pencarian Google Play.
  // Ikon ada di assets/vote/.
  VOTING_APPS: [
    {name:"IDOL CHAMP", ic:"IC", color:"#ec5a2c", icon:"assets/vote/idolchamp.png", site:"https://www.idolchamp.com", ios:"", play:"IDOL CHAMP"},
    {name:"Mubeat",     ic:"Mb", color:"#8a3d5e", icon:"assets/vote/mubeat.png",    site:"", ios:"https://apps.apple.com/app/id1320789688", play:"Mubeat for kpop Lovers"},
    {name:"Muniverse",  ic:"Mu", color:"#1c1a2e", icon:"assets/vote/muniverse.png", site:"https://www.muniverse.io", ios:"https://apps.apple.com/app/id6749677921", play:"MUNIVERSE TnK"},
    {name:"LiNC",       ic:"LC", color:"#d62f5c", icon:"assets/vote/linc.png",      site:"", ios:"https://apps.apple.com/app/linc/id6467824343", play:"LiNC STAYGE"},
    {name:"Mnet Plus",  ic:"M+", color:"#d62f5c", icon:"assets/vote/mnetplus.png",  site:"https://www.mnetplus.world", ios:"", play:"Mnet Plus"},
    {name:"Higher",     ic:"Hi", color:"#1c1a2e", icon:"assets/vote/higher.png",    site:"", ios:"https://apps.apple.com/app/id1672001935", play:"Higher 하이어"},
    {name:"Coogoong",   ic:"Cg", color:"#2a7ea6", icon:"assets/vote/coogoong.png",  site:"https://coogoong.com", ios:"https://apps.apple.com/app/id1641638840", play:"coogoong"}
  ],

  // Warna diambil dari outfit member di MV
  PAL: ["#1b8f96","#2a7ea6","#f59ab5","#d62f5c","#ec5a2c","#e6ec98","#8a3d5e"]
};
