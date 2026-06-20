import React, { useState, useEffect } from "react";
import ReactMapGL, { Marker, Popup } from "react-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

function BreakingNewsMarquee({ hotspots }) {
  const [isPaused, setIsPaused] = useState(false);

  if (!hotspots || hotspots.length === 0) {
    return (
      <div style={{
        height: "40px",
        backgroundColor: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: "1px solid #333"
      }}>
        <span style={{ color: "#aaa", fontSize: "14px" }}>No news available</span>
      </div>
    );
  }

  const renderHeadlines = (keyPrefix) =>
    hotspots.map((spot, i) => (
      <span
        key={`${keyPrefix}-${i}`}
        onClick={() => window.open(spot.url, "_blank")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: "#0077cc",
          cursor: "pointer",
          fontSize: "14px",
          marginRight: "48px",
          whiteSpace: "nowrap"
        }}
      >
        🔴&nbsp;{spot.title}
      </span>
    ));

  const animationDuration = Math.max(20, hotspots.length * 6);

  return (
    <div
      style={{
        height: "40px",
        backgroundColor: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid #333",
        overflow: "hidden",
        position: "relative"
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div style={{
        display: "inline-flex",
        animation: `marquee ${animationDuration}s linear infinite`,
        animationPlayState: isPaused ? "paused" : "running",
        whiteSpace: "nowrap"
      }}>
        {renderHeadlines("a")}
        {renderHeadlines("b")}
      </div>

      <style>
        {`
          @keyframes marquee {
            0%   { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}
      </style>
    </div>
  );
}


function StockRibbon() {
  const [stocks, setStocks] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch("/api/stocks");
        const data = await res.json();
        setStocks(Array.isArray(data.stocks) ? data.stocks : []);
        setLastUpdated(data.lastUpdated);
      } catch (err) {
        console.error(err);
        setStocks([]);
      }
    };
    fetchStocks();
    const interval = setInterval(fetchStocks, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: "#0d0d0d", color: "#fff", borderBottom: "1px solid #333" }}>
      <div style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        boxSizing: "border-box"
      }}>
        <div style={{
          display: "inline-block",
          paddingLeft: "100%",
          animation: "marquee 20s linear infinite"
        }}>
          {stocks.length === 0 ? (
            <span style={{ color: "#aaa" }}>No stock data</span>
          ) : (
            stocks.map((s, i) => (
              <span key={i} style={{ marginRight: "40px" }}>
                {s.symbol}{" "}
                <span style={{ color: s.change >= 0 ? "#2ecc71" : "#e63946" }}>
                  {s.change >= 0 ? "▲" : "▼"} {s.current}
                </span>
              </span>
            ))
          )}
        </div>
      </div>
      {lastUpdated && (
        <div style={{ fontSize: "12px", color: "#aaa", textAlign: "right", paddingRight: "10px" }}>
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      )}
      <style>
        {`
          @keyframes marquee {
            0% { transform: translate(0, 0); }
            100% { transform: translate(-100%, 0); }
          }
        `}
      </style>
    </div>
  );
}

  

function WorldMap() {
  const [viewport, setViewport] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 1.5
  });

  const [hotspots, setHotspots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);

  useEffect(() => {
    fetch("/api/news")
      .then(res => res.json())
      .then(data => {
        if (data.hotspots) {
          setHotspots(data.hotspots);
        } else {
          setHotspots([]);
        }
      })
      .catch(err => {
        console.error(err);
        setHotspots([]);
      });
  }, []);

  const handleComingSoon = (feature) => {
    alert(`${feature} feature coming soon!`);
  };

  return (
    <div style={{ fontFamily: "Inter, Segoe UI, Roboto, sans-serif", height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#0d0d0d", color: "#fff" }}>
      
      {/* ✅ Top Navigation Bar */}
      <div style={{
        height: "60px",
        backgroundColor: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.6)"
      }}>
        <h1 style={{ fontSize: "20px", margin: 0, color: "#fff" }}>🌐 Geopolitical Dashboard</h1>
        <div>
          <button onClick={() => handleComingSoon("Analytics")} style={navButtonStyle}>Analytics</button>
          <button onClick={() => handleComingSoon("Filters")} style={navButtonStyle}>Filters</button>
          <button onClick={() => handleComingSoon("Reports")} style={navButtonStyle}>Reports</button>
          <button onClick={() => handleComingSoon("Settings")} style={navButtonStyle}>Settings</button>
        </div>
      </div>

      {/* Breaking News Marquee */}
      <BreakingNewsMarquee hotspots={hotspots} />

      {/* Stock Prices Ribbon */}
      <StockRibbon />

      {/* Map */}
      <div style={{ flex: 1 }}>
        <ReactMapGL
          {...viewport}
          width="100%"
          height="100%"
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          onViewportChange={setViewport}
        >
          {hotspots.map((spot, i) => (
            <Marker key={i} latitude={spot.lat} longitude={spot.lng}>
              <div
                onClick={() => setSelectedSpot(spot)}
                style={{
                  cursor: "pointer",
                  backgroundColor: "#e63946",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  border: "2px solid #fff",
                  boxShadow: "0 0 10px rgba(230,57,70,0.8)",
                  transition: "transform 0.2s ease"
                }}
              />
            </Marker>
          ))}

          {selectedSpot && (
            <Popup
              latitude={selectedSpot.lat}
              longitude={selectedSpot.lng}
              onClose={() => setSelectedSpot(null)}
              closeOnClick={false}
              anchor="top"
            >
              <div style={{
                maxWidth: "260px",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#111",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.6)"
              }}>
                <strong style={{ color: "#0077cc" }}>{selectedSpot.title}</strong>
                <br />
                <small style={{ color: "#aaa" }}>{selectedSpot.source}</small>
                <br />
                <a href={selectedSpot.url} target="_blank" rel="noopener noreferrer" style={{ color: "#e63946" }}>
                  Read more →
                </a>
              </div>
            </Popup>
          )}
        </ReactMapGL>
      </div>
    </div>
  );
}

const navButtonStyle = {
  backgroundColor: "#222",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  marginLeft: "10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
  transition: "background-color 0.2s ease"
};

export default WorldMap;