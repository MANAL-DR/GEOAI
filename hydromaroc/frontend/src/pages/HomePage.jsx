import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/HomePage.css";

import Navbar from "../components/Navbar";
import Features from "../components/Features";


export default function HomePage() {
  const [heroVisible, setHeroVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
  }, []);

  return (
    <div className="home-page">
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow"></div>

        <div
          className={`hero-content ${heroVisible ? "hero-visible" : ""
            }`}
        >
          <div className="hero-badge">
            <span className="hero-dot"></span>
            <span>
              Agricultural Intelligence Platform
            </span>
          </div>

          <h1 className="hero-title">
            The land already holds the answer.
            <span> We help you read it.</span>
          </h1>

          <p className="hero-description">
            Before you invest in a field, know everything
            about it. TerraScope delivers deep,
            data-driven analysis of any area — soil,
            water sources, and crop suitability.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => navigate("/map")}>
              Try It Now
            </button>

            <button className="secondary-btn">
              Watch Demo
            </button>
          </div>

          <div className="hero-metrics">
            <div>
              <h3>10,000+</h3>
              <p>Areas Analyzed</p>
            </div>

            <div>
              <h3>97%</h3>
              <p>Data Accuracy</p>
            </div>

            <div>
              <h3>200+</h3>
              <p>Crop Types</p>
            </div>

            <div>
              <h3>3</h3>
              <p>Water Sources</p>
            </div>
          </div>
        </div>
      </section>

      <Features />


      <section className="cta">
        <p className="cta-tag">
          Ready to invest smart?
        </p>

        <h2 className="cta-title">
          Analyze any area in under 2 minutes.
        </h2>

        <p className="cta-description">
          Select a region on the map and receive a full
          agricultural analysis — soil profile, water
          sources and crop recommendations instantly.
        </p>

        <button className="primary-btn">
          Start Your First Analysis
        </button>
      </section>

    </div>
  );
}