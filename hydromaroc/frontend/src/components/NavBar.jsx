import { useEffect, useState } from "react";
import "../css/NavBar.css";
import { useNavigate } from "react-router-dom";

const NAV_LINKS = ["Home", "Features", "About", "Contact"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-logo" onClick={() => navigate("/")}>
        Terra<span>Scope</span>
      </div>

      <div className="navbar-links">
        {NAV_LINKS.map((link) => (
          <a key={link} href="#">
            {link}
          </a>
        ))}
      </div>

      <button className="navbar-btn">
        Sign In
      </button>
    </nav>
  );
}