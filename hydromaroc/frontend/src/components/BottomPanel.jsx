import { useState } from "react";
import "../css/BottomPanel.css";
import OptionCard from "./OptionCard";

export default function BottomPanel({ onPanelSelect }) {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Water");

  return (
    <div className={`bottom-panel ${open ? "open" : ""}`}>
      
      <div
        className="panel-handle"
        onClick={() => setOpen(!open)}
      >
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
              title="Ground Water"
              description="Aquifer and groundwater analysis."
              onClick={()=>onPanelSelect("ground-water")}
            />

            <OptionCard
              title="Surface Water"
              description="Rivers, lakes and water bodies."
              onClick={() => onPanelSelect("surface-water")}
            />

            <OptionCard
              title="CHIRPS"
              description="Rainfall and precipitation data."
              onClick={() => onPanelSelect("precipitation")}
            />
          </div>
        )}

        {activeTab === "Agriculture" && (
          <div className="cards-grid">
            <OptionCard
              title="Crop Suitability"
              description="Crop recommendations."
            />

            <OptionCard
              title="Soil Analysis"
              description="Soil quality indicators."
            />

            <OptionCard
              title="Vegetation"
              description="NDVI and vegetation metrics."
            />
          </div>
        )}
      </div>
    </div>
  );
}