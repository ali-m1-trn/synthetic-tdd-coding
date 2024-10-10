import fs from "fs";
import path from "path";

import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterEach,
  afterAll,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import Home from "../app/page";

// eslint-disable-next-line @typescript-eslint/no-require-imports
vi.mock("next/router", () => require("next-router-mock"));

interface ForexData {
  id: string;
  symbol: string;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
}

const server = setupServer(
  http.get("/api/forex", () => {
    return HttpResponse.json([
      {
        symbol: "EURUSD=X",
        id: "EURUSD=X",
        ask: 1.1234,
        bid: 1.1233,
        change: 0.0023,
        changePercent: 0.2,
      },
      {
        symbol: "USDJPY=X",
        id: "USDJPY=X",
        ask: 109.45,
        bid: 109.44,
        change: -0.15,
        changePercent: -0.14,
      },
      {
        symbol: "GBPUSD=X",
        id: "GBPUSD=X",
        ask: 1.3789,
        bid: 1.3788,
        change: 0.0045,
        changePercent: 0.33,
      },
      {
        symbol: "USDCNY=X",
        id: "USDCNY=X",
        ask: 6.4567,
        bid: 6.4566,
        change: -0.0123,
        changePercent: -0.19,
      },
      {
        symbol: "USDCAD=X",
        id: "USDCAD=X",
        ask: 1.2345,
        bid: 1.2344,
        change: 0.0012,
        changePercent: 0.1,
      },
    ]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Forex Market Overview Web App", () => {
  it("1. Uses TypeScript", () => {
    const srcDir = path.join(__dirname, "..");
    const files = fs.readdirSync(srcDir);
    const tsxOrTsFiles = files.filter(
      (file) => file.endsWith(".tsx") || file.endsWith(".ts")
    );
    expect(tsxOrTsFiles.length).toBeGreaterThan(0);
  });

  it("2. Uses Next.js", () => {
    const indexContent = fs.readFileSync(
      path.join(__dirname, "../app/page.tsx"),
      "utf-8"
    );
    expect(indexContent).toMatch(/from ['"]next/);
  });

  it("3. Follows Next.js folder structure", () => {
    const hasPages =
      fs.existsSync(path.join(__dirname, "../pages")) ||
      fs.existsSync(path.join(__dirname, "../src/pages"));
    const hasApp =
      fs.existsSync(path.join(__dirname, "../app")) ||
      fs.existsSync(path.join(__dirname, "../src/app"));

    expect(hasPages || hasApp).toBe(true);
  });

  it("4. Uses Material UI properly", () => {
    const appContent = fs.readFileSync(
      path.join(__dirname, "../app/layout.tsx"),
      "utf-8"
    );
    expect(appContent).toMatch(/CssBaseline/);
    expect(appContent).toMatch(/ThemeProvider/);
  });

  it("5. Sets document title correctly", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(document.title.toLowerCase()).toMatch(/forex.*market/i);
    });
  });

  it("6. Has a forex API endpoint", async () => {
    const response = await fetch("/api/forex");
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("7. API returns valid forex symbols", async () => {
    const response = await fetch("/api/forex");
    const data: ForexData[] = await response.json();
    const expectedSymbols = [
      "EURUSD=X",
      "USDJPY=X",
      "GBPUSD=X",
      "USDCNY=X",
      "USDCAD=X",
    ];
    expectedSymbols.forEach((symbol) => {
      expect(data.some((item) => item.symbol === symbol)).toBe(true);
    });
  });

  it("8. API returns generic forex market attributes", async () => {
    const response = await fetch("/api/forex");
    const data: ForexData[] = await response.json();
    data.forEach((item) => {
      expect(typeof item.ask).toBe("number");
      expect(typeof item.bid).toBe("number");
      expect(typeof item.change).toBe("number");
      expect(typeof item.changePercent).toBe("number");
    });
  });

  it("9. UI presents table with correct headers", async () => {
    render(<Home />);
    await waitFor(() => {
      const headers = screen.getAllByRole("columnheader");

      const headerTexts = headers.map((header) =>
        header.textContent?.toLowerCase()
      );

      const regexTargets = [
        /symbol/gi,
        /bid/gi,
        /ask/gi,
        /change/gi,
        /(%.+)?change((%.+)?|(\ percent))/gi,
      ];

      for (const regex of regexTargets) {
        expect(
          headerTexts.map((t) => t?.match(regex) ?? false)
        ).not.toHaveLength(0);
      }
    });
  });

  it("10. All API data is displayed in the table", async () => {
    render(<Home />);

    await waitFor(() => {
      const symbols = [
        "EURUSD=X",
        "USDJPY=X",
        "GBPUSD=X",
        "USDCNY=X",
        "USDCAD=X",
      ];

      symbols.forEach((symbol) => {
        expect(screen.getByText(symbol)).toBeInTheDocument();
      });
    });
  });

  it("11. Prices update periodically", async () => {
    vi.useFakeTimers();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("EURUSD=X")).toBeInTheDocument();
    });

    const initialEurUsd = screen.getByText("1.1234");

    server.use(
      http.get("/api/forex", () => {
        return HttpResponse.json([
          {
            symbol: "EURUSD=X",
            id: "EURUSD=X",
            ask: 1.1235,
            bid: 1.1234,
            change: 0.0024,
            changePercent: 0.21,
          },
        ]);
      })
    );

    vi.advanceTimersByTime(65000);

    await waitFor(() => {
      expect(screen.getByText("1.1235")).toBeInTheDocument();
      expect(initialEurUsd).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it("12. Shows progress indicator until data is loaded", async () => {
    render(<Home />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      expect(screen.getByText("EURUSD=X")).toBeInTheDocument();
    });
  });
});
