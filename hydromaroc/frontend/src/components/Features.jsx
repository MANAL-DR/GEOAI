import FeatureCard from "./FeatureCard";
import "../css/Features.css";

const FEATURES = [
  {
    title: "Deep Area Intelligence",
    subtitle: "Know your land before you invest",
    description:
      "Select any geographic area and receive a comprehensive breakdown...",
    image: "/images/area-analysis.png",
  },
  {
    title: "Water Source Mapping",
    subtitle: "Every drop accounted for",
    description:
      "Identify and locate all water sources critical to farming decisions...",
    image: "/images/water-mapping.png",
    reversed: true,
  },
  {
    title: "Crop Suitability Engine",
    subtitle: "What grows best, and exactly where",
    description:
      "Recommend the most viable farming types based on soil and climate.",
    image: "/images/crop-engine.png",
  },
];

export default function Features() {
  return (
    <section className="features">
      <div className="features-header">
        <p>Platform Capabilities</p>

        <h2>
          Every insight you need,
          <br />
          to invest with confidence.
        </h2>
      </div>

      {FEATURES.map((feature, index) => (
        <FeatureCard
          key={index}
          feature={feature}
        />
      ))}
    </section>
  );
}