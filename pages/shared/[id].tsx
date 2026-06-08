import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { connectToDatabase } from "../../lib/mongodb";
import SharedMenu from "../../models/SharedMenu";
import { menuItems } from "../../components/Layout/Header";

interface Props {
  ownerName: string;
  menuOrder: string[];
  pinnedSlugs: string[];
  shareId: string;
}

export default function SharedMenuPage({ ownerName, menuOrder, pinnedSlugs, shareId }: Props) {
  const router = useRouter();

  // Build display list: pinned first, then rest in order
  const pinned = menuOrder.filter((s) => pinnedSlugs.includes(s));
  const rest = menuOrder.filter((s) => !pinnedSlugs.includes(s));
  const getItem = (slug: string) => menuItems.find((m) => m.slug === slug);

  return (
    <>
      <Head>
        <title>{ownerName ? `${ownerName}'s` : "Shared"} DevToolsHub Menu</title>
        <meta name="description" content={`Check out this custom DevToolsHub tool menu shared by ${ownerName}`} />
      </Head>

      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-base-100 rounded-2xl shadow-xl border border-base-300 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white">
            <div className="text-xs opacity-70 mb-1">DevToolsHub · Shared Menu</div>
            <h1 className="text-lg font-bold">
              {ownerName ? `${ownerName}'s Tools` : "Custom Tool Menu"}
            </h1>
            <p className="text-xs opacity-70 mt-1">{menuOrder.length} tools • {pinnedSlugs.length} pinned</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Pinned */}
            {pinned.length > 0 && (
              <div>
                <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">⭐ Pinned</div>
                <div className="space-y-1">
                  {pinned.map((slug) => {
                    const item = getItem(slug);
                    if (!item) return null;
                    const Icon = item.icon;
                    return (
                      <button
                        key={slug}
                        onClick={() => router.push(`/${slug}`)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-sm transition-colors text-left"
                      >
                        <Icon className="w-4 h-4 text-yellow-400 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <div>
                {pinned.length > 0 && <div className="text-xs font-bold opacity-40 uppercase tracking-wider mb-2">All Tools</div>}
                <div className="space-y-1">
                  {rest.map((slug) => {
                    const item = getItem(slug);
                    if (!item) return null;
                    const Icon = item.icon;
                    return (
                      <button
                        key={slug}
                        onClick={() => router.push(`/${slug}`)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-500/10 text-sm transition-colors text-left"
                      >
                        <Icon className="w-4 h-4 opacity-60 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-base-300 p-4 text-center">
            <button
              onClick={() => router.push("/")}
              className="btn btn-primary btn-sm w-full"
            >
              Open DevToolsHub
            </button>
            <p className="text-xs opacity-40 mt-2">devtoolshub.org</p>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { id } = ctx.params ?? {};
  if (typeof id !== "string") return { notFound: true };

  try {
    await connectToDatabase();
    const doc = await SharedMenu.findOne({ shareId: id }).lean();
    if (!doc) return { notFound: true };

    return {
      props: {
        ownerName: doc.ownerName ?? "",
        menuOrder: doc.menuOrder ?? [],
        pinnedSlugs: doc.pinnedSlugs ?? [],
        shareId: doc.shareId,
      },
    };
  } catch {
    return { notFound: true };
  }
};
