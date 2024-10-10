import type { NextApiRequest, NextApiResponse } from "next";
import yahooFinance from "yahoo-finance2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const symbols = [
      "EURUSD=X",
      "GBPUSD=X",
      "USDJPY=X",
      "USDCAD=X",
      "AUDUSD=X",
      "NZDUSD=X",
    ];

    const quotes = await yahooFinance.quote(symbols);

    const data = symbols.map((symbol, index) => {
      const quote = quotes[index];
      return {
        id: symbol,
        symbol: symbol,
        bid: quote.bid,
        ask: quote.ask,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
      };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching data from Yahoo Finance:", error);
    res.status(500).json({ message: "Error fetching data." });
  }
}
