import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

beforeEach(() => {
  sessionStorage.clear();
});

describe("App auth shell", () => {
  it("shows login when not authenticated", async () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole("heading", { name: /^Login$/i })).toBeInTheDocument();
  });

  it("redirects unknown routes to login when logged out", async () => {
    render(
      <MemoryRouter initialEntries={["/unknown-route"]}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole("heading", { name: /^Login$/i })).toBeInTheDocument();
  });
});
