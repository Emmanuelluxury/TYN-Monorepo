import GameRoomLoadingClient from "@/clients/GameRoomLoadingClient";
import { generatePageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "Loading Game Room",
  description:
    "Loading your Tycoon game room. Please wait while we prepare your game.",
  canonicalPath: "/game-room-loading",
  keywords: ["game loading", "room loading", "tycoon game"],
});

type LoadingConnectionState = "loading" | "disconnected" | "timed-out";

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

interface GameRoomLoadingContentProps {
  connectionState: LoadingConnectionState;
  roomId: string | null;
}

function normalizeSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const first: string | undefined = value[0];
    return first !== undefined ? first : undefined;
  }
  return value;
}

function parseRoomId(raw: string | undefined): string | null {
  const trimmed: string = raw?.trim() ?? "";
  return trimmed.length > 0 ? trimmed.toUpperCase() : null;
}

function resolveLoadingConnectionState(
  stateParam: string | undefined,
): LoadingConnectionState {
  const normalized: string = stateParam?.trim().toLowerCase() ?? "";
  if (normalized === "disconnected" || normalized === "stale") {
    return "disconnected";
  }
  if (normalized === "timeout" || normalized === "timed-out") {
    return "timed-out";
  }
  return "loading";
}

function buildLoadingStatusText(
  connectionState: LoadingConnectionState,
  roomId: string | null,
): string {
  if (connectionState === "disconnected") {
    return "Connection lost while loading the game room.";
  }
  if (connectionState === "timed-out") {
    return "Loading timed out. Please try again.";
  }
  if (roomId !== null) {
    return `Preparing game room ${roomId}. Please wait.`;
  }
  return "Preparing your game room. Please wait.";
}

function GameRoomLoadingContent({
  connectionState,
  roomId,
}: GameRoomLoadingContentProps): React.JSX.Element {
  const statusText: string = buildLoadingStatusText(connectionState, roomId);
  const isLoading: boolean = connectionState === "loading";

  if (connectionState === "disconnected") {
    return (
      <main
        aria-label="Game room disconnected"
        role="alert"
        className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[var(--tycoon-bg)] px-4"
      >
        <h1 className="mb-4 text-center font-orbitron text-2xl font-bold text-[var(--tycoon-accent)]">
          Connection Lost
        </h1>
        <p className="mb-6 text-center text-[var(--tycoon-text-muted)]">
          Unable to reach the game room. Check your connection and try again.
        </p>
        <a
          href="/game-room-loading"
          className="rounded bg-[var(--tycoon-accent)] px-6 py-3 font-orbitron font-bold text-[var(--tycoon-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--tycoon-accent)] focus:ring-offset-2 focus:ring-offset-[var(--tycoon-bg)]"
        >
          Retry
        </a>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {statusText}
        </div>
      </main>
    );
  }

  if (connectionState === "timed-out") {
    return (
      <main
        aria-label="Game room loading timed out"
        role="alert"
        className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[var(--tycoon-bg)] px-4"
      >
        <h1 className="mb-4 text-center font-orbitron text-2xl font-bold text-[var(--tycoon-accent)]">
          Loading Timed Out
        </h1>
        <p className="mb-6 text-center text-[var(--tycoon-text-muted)]">
          The game room took too long to load. Please try again.
        </p>
        <a
          href="/game-room-loading"
          className="rounded bg-[var(--tycoon-accent)] px-6 py-3 font-orbitron font-bold text-[var(--tycoon-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--tycoon-accent)] focus:ring-offset-2 focus:ring-offset-[var(--tycoon-bg)]"
        >
          Retry
        </a>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {statusText}
        </div>
      </main>
    );
  }

  return (
    <main
      aria-label="Game room loading"
      aria-busy={isLoading ? "true" : undefined}
      className="relative min-h-screen w-full bg-[var(--tycoon-bg)]"
    >
      <a
        href="#loading-content-region"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[var(--tycoon-accent)] focus:px-4 focus:py-2 focus:text-[var(--tycoon-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--tycoon-accent)] focus:ring-offset-2 focus:ring-offset-[var(--tycoon-bg)]"
      >
        Skip to loading status
      </a>

      <h1 className="sr-only font-orbitron text-2xl font-bold text-[var(--tycoon-accent)]">
        Loading Game Room
      </h1>

      <div
        id="loading-status-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Loading progress updates"
        className="sr-only"
      >
        {statusText}
      </div>

      <section
        id="loading-content-region"
        aria-label="Game room loading content"
        className="h-full w-full focus-within:ring-2 focus-within:ring-[var(--tycoon-accent)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--tycoon-bg)] [&_*:focus-visible]:outline-none [&_*:focus-visible]:ring-2 [&_*:focus-visible]:ring-[var(--tycoon-accent)] [&_*:focus-visible]:ring-offset-2"
      >
        <GameRoomLoadingClient />
      </section>
    </main>
  );
}

export default async function GameRoomLoadingPage({
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const params: Record<string, string | string[] | undefined> =
    searchParams !== undefined ? await searchParams : {};
  const stateParam: string | undefined = normalizeSearchParam(params.state);
  const roomIdParam: string | undefined = normalizeSearchParam(params.roomId);
  const connectionState: LoadingConnectionState =
    resolveLoadingConnectionState(stateParam);
  const roomId: string | null = parseRoomId(roomIdParam);

  return (
    <GameRoomLoadingContent
      connectionState={connectionState}
      roomId={roomId}
    />
  );
}
