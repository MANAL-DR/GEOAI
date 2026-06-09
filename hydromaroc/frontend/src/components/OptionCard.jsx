import "../css/OptionCard.css";

export default function OptionCard({ title, description, onClick}) {
  return (
    <div className="option-card" onClick={onClick}>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}