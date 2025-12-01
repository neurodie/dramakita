const NETSHORT_BASE = "http://localhost:3000/api";

export async function nsGetEpisodes(shortPlayId: string) {
  const res = await fetch(`${NETSHORT_BASE}/getepisode/${shortPlayId}`);
  if (!res.ok) throw new Error(`Netshort Episode List HTTP ${res.status}`);
  return res.json();
}

export async function nsUnlockEpisode(shortPlayId: string, episodeNo: number) {
  const res = await fetch(
    `${NETSHORT_BASE}/getepisode/${shortPlayId}/${episodeNo}`
  );
  if (!res.ok) throw new Error(`Netshort Unlock Episode HTTP ${res.status}`);
  return res.json();
}
