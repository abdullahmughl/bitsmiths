import Link from "next/link";
import { getStoriesPage, type HNItem } from "@/lib/hn";

const PAGE_SIZE = 30;

function formatHost(url?: string) {
  if (!url) return "news.ycombinator.com";
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return "news.ycombinator.com";
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page ?? 1) || 1);
  const { items, total } = await getStoriesPage(page, PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="w-full bg-white flex justify-center p-0 md:p-2">
      <div className="min-h-screen max-w-full md:max-w-[85%] bg-white w-full">
        <header className="bg-[#ff6600] text-black h-10 md:h-6">
          <div className="flex items-center gap-3 text-[15px] md:text-[13.33px] h-full px-2">
            <div className="font-bold">Hacker News</div>
            <nav className="text-sm text-black/80">
              <Link className="hover:underline" href="/">
                top
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto bg-[#f6f6ef] px-3 py-3">
          <ol className="space-y-2">
            {items.map((item: HNItem, idx) => (
              <li
                key={item.id}
                className="grid grid-cols-[auto_1fr] gap-2 text-[13.33px] font-normal"
              >
                <span className="text-[#828282] w-6 text-right">
                  {(page - 1) * PAGE_SIZE + idx + 1}.
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={
                        item.url ??
                        `https://news.ycombinator.com/item?id=${item.id}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-black hover:underline"
                    >
                      {item.title}
                    </a>
                    <span className="text-[#828282]">
                      ({formatHost(item.url)})
                    </span>
                  </div>
                  <div className="text-[#828282] space-x-2">
                    {item.score != null && <span>{item.score} points</span>}
                    <span>by {item.by}</span>
                    <a
                      className="hover:underline"
                      href={`https://news.ycombinator.com/item?id=${item.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.descendants != null
                        ? `${item.descendants} comments`
                        : "discuss"}
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex justify-between items-center mt-6 text-sm">
            <div className="text-[#828282]">
              Page {page} of {totalPages}
            </div>
            <div className="space-x-3">
              {page > 1 && (
                <Link
                  href={`/?page=${page - 1}`}
                  className="text-[#828282] hover:underline"
                >
                  Prev
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/?page=${page + 1}`}
                  className="text-[#828282] hover:underline"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
