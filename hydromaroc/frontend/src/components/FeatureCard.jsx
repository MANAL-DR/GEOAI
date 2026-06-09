import "../css/Features.css";

export default function FeatureCard({ feature }) {
  return (
    <div
      className={`feature-card ${feature.reversed ? "reverse" : ""
        }`}
    >
      <div className="feature-content">
        <span className="feature-badge">
          {feature.subtitle}
        </span>

        <h3>{feature.title}</h3>

        <p>{feature.description}</p>
      </div>

      <div className="feature-image">
        <img
          src={feature.image}
          alt={feature.title}
        />
      </div>
    </div>
  );
}