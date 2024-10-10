"use client";

import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, CircularProgress } from "@mui/material";

interface ForexData {
  id: string;
  symbol: string;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
}

const Home: NextPage = () => {
  const [forexData, setForexData] = useState<ForexData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/forex");
        const data = await response.json();
        setForexData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Update data every 60 seconds (adjust as needed)
    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const columns: GridColDef[] = [
    { field: "symbol", headerName: "Currency Pair", width: 150 },
    { field: "bid", headerName: "Bid", width: 100, type: "number" },
    { field: "ask", headerName: "Ask", width: 100, type: "number" },
    {
      field: "change",
      headerName: "Change",
      width: 100,
      type: "number",
      cellClassName: (params) =>
        params.value > 0
          ? "positive-change"
          : params.value < 0
          ? "negative-change"
          : "",
      valueFormatter: (value) => value?.toFixed(4),
    },
    {
      field: "changePercent",
      headerName: "% Change",
      width: 120,
      type: "number",
      cellClassName: (params) =>
        params.value > 0
          ? "positive-change"
          : params.value < 0
          ? "negative-change"
          : "",
      valueFormatter: (value) => `${parseFloat(value.toFixed(2))}%`,
    },
  ];

  return (
    <div>
      <Head>
        <title>Forex Market Overview</title>
      </Head>
      <Box sx={{ height: "calc(100vh - 64px)", width: "100%" }}>
        {" "}
        {/* Adjust height as needed */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid rows={forexData} columns={columns} autoHeight />
        )}
      </Box>
    </div>
  );
};

export default Home;
