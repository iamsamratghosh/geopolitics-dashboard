const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const NEWS_API_KEY = process.env.NEWS_API_KEY;

app.get("/api/news", async (req, res) => {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=conflict&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`
    );
    const data = await response.json();

    if (!data.articles) {
      return res.status(500).json({ error: "No articles returned" });
    }

    const hotspots = data.articles.map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt
    }));

    res.json({ hotspots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
