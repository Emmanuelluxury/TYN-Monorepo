import { render, screen } from "@testing-library/react";
import { expect, test, describe, vi } from "vitest";
import GamePlayPage from "./page";

vi.mock("@/components/game/GameBoard", () => ({
  default: () => <div data-testid="game-board">Board</div>,
}));

describe("Game Play Page - TypeScript Strictness", () => {
  describe("Return types", () => {
    test("page resolves to a valid React element", async () => {
      const result = render(await GamePlayPage({}));
      expect(result.container.firstChild).toBeDefined();
    });

    test("page accepts optional searchParams promise", async () => {
      const searchParams = Promise.resolve({ gameId: "abc123" });
      const result = render(await GamePlayPage({ searchParams }));
      expect(result.container).toBeInTheDocument();
    });
  });

  describe("Null and undefined guards", () => {
    test("handles missing searchParams", async () => {
      const { container } = render(await GamePlayPage({}));
      expect(
        container.querySelector('main[aria-label="Tycoon game play"]'),
      ).toBeInTheDocument();
    });

    test("handles undefined gameId", async () => {
      const searchParams = Promise.resolve({});
      const { container } = render(await GamePlayPage({ searchParams }));
      const announcer = container.querySelector("#game-status-announcer");
      expect(announcer?.textContent).toContain("Game board ready");
    });

    test("handles empty gameId as absent", async () => {
      const searchParams = Promise.resolve({ gameId: "   " });
      const { container } = render(await GamePlayPage({ searchParams }));
      const announcer = container.querySelector("#game-status-announcer");
      expect(announcer?.textContent).toContain("Game board ready");
    });

    test("normalizes valid gameId to uppercase", async () => {
      const searchParams = Promise.resolve({ gameId: "  test99  " });
      const { container } = render(await GamePlayPage({ searchParams }));
      const announcer = container.querySelector("#game-status-announcer");
      expect(announcer?.textContent).toContain("TEST99");
    });

    test("handles array search param values", async () => {
      const searchParams = Promise.resolve({ gameId: ["room1", "room2"] });
      const { container } = render(await GamePlayPage({ searchParams }));
      const announcer = container.querySelector("#game-status-announcer");
      expect(announcer?.textContent).toContain("ROOM1");
    });

    test("handles empty array search param values", async () => {
      const searchParams = Promise.resolve({ gameId: [] });
      const { container } = render(await GamePlayPage({ searchParams }));
      const announcer = container.querySelector("#game-status-announcer");
      expect(announcer?.textContent).toContain("Game board ready");
    });
  });

  describe("Stale and disconnected states", () => {
    test("renders disconnected UI when state is disconnected", async () => {
      const searchParams = Promise.resolve({ state: "disconnected" });
      const { container } = render(await GamePlayPage({ searchParams }));
      expect(
        container.querySelector('main[role="alert"]'),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Connection Lost" })).toBeInTheDocument();
    });

    test("renders disconnected UI when state is stale", async () => {
      const searchParams = Promise.resolve({ state: "stale" });
      const { container } = render(await GamePlayPage({ searchParams }));
      expect(
        container.querySelector('main[aria-label="Game disconnected"]'),
      ).toBeInTheDocument();
    });

    test("disconnected state does not render game board", async () => {
      const searchParams = Promise.resolve({ state: "disconnected" });
      render(await GamePlayPage({ searchParams }));
      expect(screen.queryByTestId("game-board")).not.toBeInTheDocument();
    });

    test("retry link is present in disconnected state", async () => {
      const searchParams = Promise.resolve({ state: "disconnected" });
      render(await GamePlayPage({ searchParams }));
      expect(screen.getByRole("link", { name: "Retry" })).toHaveAttribute(
        "href",
        "/game-play",
      );
    });
  });
});
