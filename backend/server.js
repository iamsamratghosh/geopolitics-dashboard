const express = require("express");
const cors = require("cors");
const nlp = require("compromise");
require("dotenv").config();

const app = express();

app.get("/api/hello", (req, res) => {
  res.json({ message: "Backend is live!" });
});

module.exports = app;

app.use(cors());

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN; // reuse your frontend token

// Helper: geocode a place string
async function geocodeLocation(placeName) {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeName)}.json?access_token=${MAPBOX_TOKEN}`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return {
        lat: data.features[0].center[1],
        lng: data.features[0].center[0]
      };
    }
  } catch (err) {
    console.error("Geocoding failed:", err);
  }
  return null;
}

// Very simple helper: try to extract a country/place from the title
function extractPlaceName(text) {
  if (!text) return null;
  const doc = nlp(text);
  const places = doc.places().out("array");
  return places.length > 0 ? places[0] : null;
}

console.log("Loaded API key:", NEWS_API_KEY);

// News route
app.get("/api/news", async (req, res) => {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=war OR protest OR tensions OR geopolitics&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`
    );
    const data = await response.json();

    console.log("NewsAPI raw response:", data);

    if (!data.articles || data.articles.length === 0) {
      return res.json({ hotspots: [] });
    }

    const hotspots = [];
    for (const a of data.articles.slice(0, 10)) {
      const placeName = extractPlaceName(a.title + " " + a.description);
      let coords = null;
      if (placeName) {
        coords = await geocodeLocation(placeName);
        console.log("Geocoded coords for", placeName, ":", coords);
      }
      hotspots.push({
        title: a.title,
        source: a.source.name,
        url: a.url,
        publishedAt: a.publishedAt,
        lat: coords ? coords.lat : 28.6139, // fallback: Delhi
        lng: coords ? coords.lng : 77.2090
      });
    }

    res.json({ hotspots });
  } catch (err) {
    console.error("Backend fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

const axios = require("axios");

let cachedStocks = [];
let lastFetchTime = 0;

app.get("/api/stocks", async (req, res) => {
  const now = Date.now();

  if (cachedStocks.length > 0 && (now - lastFetchTime) < 60 * 1000) {
    return res.json({ stocks: cachedStocks, lastUpdated: new Date(lastFetchTime).toISOString() });
  }

  try {
    const symbols = ["AAPL", "TSLA", "MSFT", "GOOGL"];
    const results = await Promise.all(
      symbols.map(async sym => {
        try {
          const url = `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${process.env.FINNHUB_KEY}`;
          const response = await axios.get(url);
          return {
            symbol: sym,
            current: response.data.c,
            change: response.data.d,
            percent: response.data.dp
          };
        } catch (err) {
          console.error(`Failed to fetch ${sym}:`, err.message);
          return null;
        }
      })
    );

    cachedStocks = results.filter(r => r !== null);
    lastFetchTime = now;

    res.json({ stocks: cachedStocks, lastUpdated: new Date(lastFetchTime).toISOString() });
  } catch (err) {
    console.error("Stock fetch failed:", err.message);
    res.json({ stocks: cachedStocks, lastUpdated: new Date(lastFetchTime).toISOString() });
  }
});


app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
