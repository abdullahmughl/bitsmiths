export type HNItem = {
  id: number;
  by: string;
  title: string;
  url?: string;
  type: string;
  time: number;
  score?: number;
  descendants?: number;
};

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";

export async function getTopStoryIds(): Promise<number[]> {
  const res = await fetch(`${HN_API_BASE}/topstories.json`, {
    // Enable ISR: revalidate this list periodically
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch top stories: ${res.status}`);
  }
  return res.json();
}

export async function getItem(id: number): Promise<HNItem> {
  const res = await fetch(`${HN_API_BASE}/item/${id}.json`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch item ${id}: ${res.status}`);
  }
  return res.json();
}

export async function getStoriesPage(
  page: number,
  pageSize: number
): Promise<{ items: HNItem[]; total: number }> {
  const ids = await getTopStoryIds();
  const total = ids.length;
  const start = Math.max(0, (page - 1) * pageSize);
  const pageIds = ids.slice(start, start + pageSize);
  const items = await Promise.all(pageIds.map((id) => getItem(id)));
  return { items, total };
}
