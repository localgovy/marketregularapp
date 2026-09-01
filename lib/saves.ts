export type SaveKind = "market" | "vendor";

export type Saves = {
  markets: string[];
  vendors: string[];
};

export const EMPTY_SAVES: Saves = { markets: [], vendors: [] };

export function isSaved(kind: SaveKind, slug: string, saves: Saves) {
  return saves[kind === "market" ? "markets" : "vendors"].includes(slug);
}

export function sameSaves(left: Saves, right: Saves) {
  return (
    left.markets.join("\0") === right.markets.join("\0") &&
    left.vendors.join("\0") === right.vendors.join("\0")
  );
}

export function toSaves(rows: Array<{ kind: string; slug: string }> | null): Saves {
  const markets: string[] = [];
  const vendors: string[] = [];
  for (const row of rows ?? []) {
    if (row.kind === "market") markets.push(row.slug);
    else if (row.kind === "vendor") vendors.push(row.slug);
  }
  return { markets, vendors };
}
