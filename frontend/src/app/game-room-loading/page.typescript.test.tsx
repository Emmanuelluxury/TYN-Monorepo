import { render, screen } from "@testing-library/react";
import { expect, test, describe, vi } from "vitest";
import GameRoomLoadingPage from "./page";

vi.mock("@/clients/GameRoomLoadingClient", () => ({
  default: () => <div data-testid="loading-client">Loading...</div>,
}));

describe("Game Room Loading Page - TypeScript Strictness", () => {
  describe("Return types", () => {
    test("page resolves to a valid React element", async () => {
      const result = render(await GameRoomLoadingPage({}));
      expect(result.container.firstChild).toBeDefined();
    });

    test("page accepts optional searchParams promise", async () => {
      const searchParams = Promise.resolve({ roomId: "room42" });
      const result = render(await GameRoomLoadingPage({ searchParams }));
      expect(result.container).toBeInTheDocument();
    });
  });

  describe("Null and undefined guards", () => {
    test("handles missing searchParams", async () => {
      const { container } = render(await GameRoomLoadingPage({}));
      expect(
        container.querySelector('main[aria-label="Game room loading"]'),
      ).toBeInTheDocument();
    });

    test("handles undefined roomId", async () => {
      const searchParams = Promise.resolve({});
      const { container } = render(await GameRoomLoadingPage({ searchParams }));
      const announcer = container.querySelector("#loading-status-announcer");
      expect(announcer?.textContent).toContain("Preparing your game room");
    });

    test("handles empty roomId as absent", async () => {
      const searchParams = Promise.resolve({ roomId: "   " });
      const { container } = render(await GameRoomLoadingPage({ searchParams }));
      const announcer = container.querySelector("#loading-status-announcer");
      expect(announcer?.textContent).toContain("Preparing your game room");
    });

    test("normalizes valid roomId to uppercase", async () => {
      const searchParams = Promise.resolve({ roomId: "  alpha1  " });
      const { container } = render(await GameRoomLoadingPage({ searchParams }));
      const announcer = container.querySelector("#loading-status-announcer");
      expect(announcer?.textContent).toContain("ALPHA1");
    });

    test("handles array search param values", async () => {
      const searchParams = Promise.resolve({ roomId: ["beta2", "gamma3"] });
      const { container } = render(await GameRoomLoadingPage({ searchParams }));
      const announcer = container.querySelector("#loading-status-announcer");
      expect(announcer?.textContent).toContain("BETA2");
    });

    test("handles empty array search param values", async () => {
      const searchParams = Promise.resolve({ roomId: [] });
      const { container } = render(await GameRoomLoadingPage({ searchParams }));
      const announcer = container.querySelector("#loading-status-announcer");
      expect(announcer?.textContent).toContain("Preparing your game room");
    });
  });

  describe("Stale, disconnected, and timed-out states", () => {
    test("renders disconnected UI when state is disconnected", async () => {
      const searchParams = Promise.resolve({ state: "disconnected" });
      const { container } = render(await GameRoomLoadingPage({ searchParams }));
      expect(
        container.querySelector('main[role="alert"]'),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Connection Lost" })).toBeInTheDocument();
    });

    test("renders disconnected UI when state is stale", async () => {
      const searchParams = Promise.resolve({ state: "stale" });
      const { container } = render(await GameRoomLoadingPage({ searchParams }));
      expect(
        container.querySelector('main[aria-label="Game room disconnected"]'),
      ).toBeInTheDocument();
    });

    test("renders timed-out UI when state is timeout", async () => {
      const searchParams = Promise.resolve({ state: "timeout" });
      render(await GameRoomLoadingPage({ searchParams }));
      expect(
        screen.getByRole("heading", { name: "Loading Timed Out" }),
      ).toBeInTheDocument();
    });

    test("error states do not render loading client", async () => {
      const searchParams = Promise.resolve({ state: "timed-out" });
      render(await GameRoomLoadingPage({ searchParams }));
      expect(screen.queryByTestId("loading-client")).not.toBeInTheDocument();
    });

    test("retry link is present in error states", async () => {
      const searchParams = Promise.resolve({ state: "disconnected" });
      render(await GameRoomLoadingPage({ searchParams }));
      expect(screen.getByRole("link", { name: "Retry" })).toHaveAttribute(
        "href",
        "/game-room-loading",
      );
    });
  });
});
