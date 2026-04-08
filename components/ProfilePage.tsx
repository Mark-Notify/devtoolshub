import React, { useEffect, useState, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  ClockIcon,
  StarIcon,
  BookmarkIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  WrenchScrewdriverIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { menuItems } from "./Layout/Header";

interface HistoryItem {
  _id: string;
  tool: string;
  inputData: string;
  outputData: string;
  createdAt: string;
}

interface Snippet {
  _id: string;
  toolKey: string;
  title: string;
  content: string;
  isFavorite: boolean;
  createdAt: string;
}

interface FavoriteItem {
  _id: string;
  toolKey: string;
}

const toolLabel = (key: string) =>
  menuItems.find((m) => m.slug === key)?.label ?? key;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function usageByTool(history: HistoryItem[]) {
  const counts: Record<string, number> = {};
  history.forEach((h) => {
    counts[h.tool] = (counts[h.tool] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

const ProfilePage: React.FC = () => {
  const { data: session } = useSession();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSnippet, setDeletingSnippet] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [histRes, snippRes, favRes] = await Promise.all([
        fetch("/api/get-data"),
        fetch("/api/snippets"),
        fetch("/api/favorites"),
      ]);
      if (histRes.ok) setHistory(await histRes.json());
      if (snippRes.ok) setSnippets(await snippRes.json());
      if (favRes.ok) setFavorites(await favRes.json());
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteSnippet = async (id: string) => {
    setDeletingSnippet(id);
    try {
      await fetch("/api/snippets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setSnippets((prev) => prev.filter((s) => s._id !== id));
    } finally {
      setDeletingSnippet(null);
    }
  };

  const toggleFavoriteSnippet = async (snippet: Snippet) => {
    const res = await fetch("/api/snippets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: snippet._id, isFavorite: !snippet.isFavorite }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSnippets((prev) => prev.map((s) => (s._id === snippet._id ? updated : s)));
    }
  };

  const memberSince = session?.user
    ? new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const topTools = usageByTool(history);
  const recentHistory = history.slice(0, 5);
  const favoriteSnippets = snippets.filter((s) => s.isFavorite);

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-base-100 rounded-2xl shadow-lg p-8 text-center border border-base-300">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <WrenchScrewdriverIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Sign in to DevToolsHub</h2>
          <p className="text-sm opacity-60 mb-6">
            Save your history, favorites, and snippets across all your devices.
          </p>
          <button className="btn btn-primary w-full" onClick={() => signIn("google")}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* Profile header */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-base-100 rounded-2xl shadow border border-base-300 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <img
            src={session.user?.image ?? "/default-profile.png"}
            alt="Profile"
            className="w-20 h-20 rounded-full shadow border-4 border-base-200 object-cover bg-gray-200 shrink-0"
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold">{session.user?.name}</h1>
            <p className="text-sm opacity-60">{session.user?.email}</p>
            <p className="text-xs opacity-40 mt-1">Member since {memberSince}</p>
          </div>
          <button
            className="btn btn-sm btn-error gap-1.5"
            onClick={() => signOut()}
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ChartBarIcon, label: "Total Usage", value: history.length, color: "text-blue-500" },
          { icon: StarIcon, label: "Favorites", value: favorites.length, color: "text-yellow-500" },
          { icon: BookmarkIcon, label: "Snippets", value: snippets.length, color: "text-green-500" },
          {
            icon: WrenchScrewdriverIcon,
            label: "Tools Used",
            value: new Set(history.map((h) => h.tool)).size,
            color: "text-purple-500",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-base-100 rounded-xl border border-base-300 p-4 text-center shadow-sm">
            <Icon className={`w-6 h-6 mx-auto mb-1 ${color}`} />
            <div className="text-2xl font-bold">{loading ? "—" : value}</div>
            <div className="text-xs opacity-50">{label}</div>
          </div>
        ))}
      </div>

      {/* 3-column cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Most Used Tools */}
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
            <ChartBarIcon className="w-4 h-4 text-blue-500" />
            Most Used Tools
          </h3>
          {loading ? (
            <div className="opacity-40 text-sm">Loading...</div>
          ) : topTools.length === 0 ? (
            <p className="text-xs opacity-40">No usage yet. Start using a tool!</p>
          ) : (
            <ul className="space-y-2">
              {topTools.map(([tool, count]) => (
                <li key={tool} className="flex items-center justify-between text-sm">
                  <span className="truncate opacity-80">{toolLabel(tool)}</span>
                  <span className="badge badge-sm badge-ghost shrink-0">{count}x</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
            <ClockIcon className="w-4 h-4 text-purple-500" />
            Recent Activity
          </h3>
          {loading ? (
            <div className="opacity-40 text-sm">Loading...</div>
          ) : recentHistory.length === 0 ? (
            <p className="text-xs opacity-40">No history yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentHistory.map((item) => (
                <li key={item._id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate opacity-80">{toolLabel(item.tool)}</span>
                    <span className="text-xs opacity-40 shrink-0 ml-2">{timeAgo(item.createdAt)}</span>
                  </div>
                  {item.inputData && (
                    <div className="text-xs opacity-40 truncate font-mono">{item.inputData}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Favorite Tools */}
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
            <StarSolidIcon className="w-4 h-4 text-yellow-500" />
            Favorite Tools
          </h3>
          {loading ? (
            <div className="opacity-40 text-sm">Loading...</div>
          ) : favorites.length === 0 ? (
            <p className="text-xs opacity-40">No favorites yet. Star a tool from the sidebar!</p>
          ) : (
            <ul className="space-y-2">
              {favorites.map((fav) => (
                <li key={fav._id} className="text-sm flex items-center gap-2">
                  <StarSolidIcon className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  <span className="truncate opacity-80">{toolLabel(fav.toolKey)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Saved Snippets */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
            <BookmarkIcon className="w-4 h-4 text-green-500" />
            Saved Snippets
            <span className="badge badge-sm badge-ghost ml-1">{snippets.length}</span>
          </h3>
          {loading ? (
            <div className="opacity-40 text-sm">Loading...</div>
          ) : snippets.length === 0 ? (
            <p className="text-xs opacity-40">
              No snippets saved yet. Use the Save button in any tool to save a snippet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {snippets.map((snippet) => (
                <div
                  key={snippet._id}
                  className="border border-base-300 rounded-lg p-3 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{snippet.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => toggleFavoriteSnippet(snippet)}
                        title={snippet.isFavorite ? "Unfavorite" : "Favorite"}
                      >
                        {snippet.isFavorite ? (
                          <StarSolidIcon className="w-3.5 h-3.5 text-yellow-500" />
                        ) : (
                          <StarIcon className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        className="btn btn-xs btn-ghost text-error"
                        onClick={() => deleteSnippet(snippet._id)}
                        disabled={deletingSnippet === snippet._id}
                        title="Delete snippet"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs opacity-40 flex items-center justify-between">
                    <span className="badge badge-xs badge-ghost">{toolLabel(snippet.toolKey)}</span>
                    <span>{timeAgo(snippet.createdAt)}</span>
                  </div>
                  <pre className="text-xs font-mono opacity-60 truncate bg-base-200 rounded p-1.5 mt-1">
                    {snippet.content.slice(0, 80)}{snippet.content.length > 80 ? "…" : ""}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pinned Snippets */}
      {favoriteSnippets.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-base-100 rounded-xl border border-yellow-400/30 shadow-sm p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
              <StarSolidIcon className="w-4 h-4 text-yellow-500" />
              Pinned Snippets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favoriteSnippets.map((snippet) => (
                <div key={snippet._id} className="border border-yellow-400/20 rounded-lg p-3">
                  <div className="font-medium text-sm">{snippet.title}</div>
                  <div className="text-xs opacity-40 mt-0.5">
                    <span className="badge badge-xs badge-ghost">{toolLabel(snippet.toolKey)}</span>
                  </div>
                  <pre className="text-xs font-mono opacity-60 truncate bg-base-200 rounded p-1.5 mt-1">
                    {snippet.content.slice(0, 100)}{snippet.content.length > 100 ? "…" : ""}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
