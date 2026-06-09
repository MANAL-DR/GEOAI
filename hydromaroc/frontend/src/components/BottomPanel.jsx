import { useState } from "react";
import "../css/BottomPanel.css";
import OptionCard from "./OptionCard";

export default function BottomPanel({ onPanelSelect }) {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Water");

  return (
    <div className={`bottom-panel ${open ? "open" : ""}`}>
      
      <div className="panel-handle" onClick={() => setOpen(!open)}>
        <div className="handle-bar"></div>
      </div>

      <div className="panel-header">
        <h3>Area Analysis</h3>
        <div className="panel-tabs">
          <button
            className={activeTab === "Water" ? "active" : ""}
            onClick={() => setActiveTab("Water")}
          >
            Water
          </button>
          <button
            className={activeTab === "Agriculture" ? "active" : ""}
            onClick={() => setActiveTab("Agriculture")}
          >
            Agriculture
          </button>
        </div>
      </div>

      <div className="panel-content">
        {activeTab === "Water" && (
          <div className="cards-grid">
            <OptionCard
              title="Surface Water"
              description="Rivers, lakes and water bodies — JRC Global Surface Water."
              onClick={() => onPanelSelect("surface-water")}
            />
            <OptionCard
              title="Ground Water"
              description="Aquifer and soil moisture — GLDAS NASA."
              onClick={() => onPanelSelect("ground-water")}
            />
            <OptionCard
              title="Precipitation"
              description="Rainfall and precipitation data — CHIRPS v2.0."
              onClick={() => onPanelSelect("precipitation")}
            />
            <OptionCard
              title="Temperature"
              description="Land surface temperature — MODIS MOD11A2."
              onClick={() => onPanelSelect("temperature")}
            />
          </div>
        )}

        {activeTab === "Agriculture" && (
          <div className="cards-grid">
            <OptionCard
              title="Land Suitability"
              description="Agricultural suitability — ESA WorldCover v200."
              onClick={() => onPanelSelect("land-suitability")}
            />
            <OptionCard
              title="Crop Classification"
              description="ML-based crop type prediction."
              onClick={() => onPanelSelect("agri")}
            />
            <OptionCard
              title="Vegetation"
              description="NDVI and vegetation metrics — Sentinel-2."
              onClick={() => onPanelSelect("ndvi")}
            />
          </div>
        )}
      </div>
    </div>
  );
}