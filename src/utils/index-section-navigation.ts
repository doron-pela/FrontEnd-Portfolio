export type PortfolioSectionKey = "0" | "1" | "2" | "3" | "4";

const PORTFOLIO_PENDING_SECTION_KEY = "portfolio:pending-home-section-key";

const VALID_PORTFOLIO_SECTION_KEYS = new Set<PortfolioSectionKey>([
  "0",
  "1",
  "2",
  "3",
  "4",
]);

export function dispatchPortfolioSectionKey(key: PortfolioSectionKey) {
  //ScrollLockedSectionController already owns the authoritative mapping between
  //these numeric keys and section navigation. Dispatching a KeyboardEvent keeps
  //navbar clicks on exactly the same programmatic-scroll path as the keyboard.
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      bubbles: true,
    }),
  );
}

export function queuePortfolioSectionKey(key: PortfolioSectionKey) {
  window.sessionStorage.setItem(PORTFOLIO_PENDING_SECTION_KEY, key);
}

export function consumeQueuedPortfolioSectionKey(): PortfolioSectionKey | null {
  const pendingKey = window.sessionStorage.getItem(
    PORTFOLIO_PENDING_SECTION_KEY,
  );

  if (!pendingKey) {
    return null;
  }

  //Consume first so a failed/aborted later animation cannot leave a stale
  //instruction that unexpectedly fires on a future homepage mount.
  window.sessionStorage.removeItem(PORTFOLIO_PENDING_SECTION_KEY);

  if (!VALID_PORTFOLIO_SECTION_KEYS.has(pendingKey as PortfolioSectionKey)) {
    return null;
  }

  return pendingKey as PortfolioSectionKey;
}
