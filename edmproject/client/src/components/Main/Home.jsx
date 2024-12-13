import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./styles.module.css";
import ExpenseTracker from "./ExpenseTracker";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [isNavActive, setIsNavActive] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem("activeSection") || "home";
  });

  const toggleNav = () => {
    setIsNavActive(!isNavActive);
  };

  const handleLogout = async () => {
    // Clear localStorage
    localStorage.clear();

    // Small delay to ensure state updates are processed
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Force a reload while navigating to ensure clean state
    window.location.href = "/login";
  };

  useEffect(() => {
    // Set active section based on stored value
    const savedSection = localStorage.getItem("activeSection");
    if (savedSection) {
      setActiveSection(savedSection);
    }
  }, []);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    localStorage.setItem("activeSection", section);
  };

  const words = useMemo(
    () => ["Hunter!", "Hacker!", "Developer!", "Innovator!"],
    []
  );

  // Typing effect logic
  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % words.length;
      const fullText = words[i];

      setText(
        isDeleting
          ? fullText.substring(0, text.length - 1)
          : fullText.substring(0, text.length + 1)
      );

      setTypingSpeed(isDeleting ? 30 : 150);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 500);
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, words]);

  return (
    <div className={styles.main_container}>
      <header>
        <a
          href="#"
          className={styles.logo}
          onClick={() => handleSectionChange("home")}
        >
          PHANTOM GANG
        </a>

        <nav className={`${styles.nav} ${isNavActive ? styles.navActive : ""}`}>
          <a
            href="#"
            className={activeSection === "home" ? styles.active : ""}
            onClick={() => handleSectionChange("home")}
          >
            Home
          </a>
          <a
            href="#"
            className={activeSection === "about" ? styles.active : ""}
            onClick={() => handleSectionChange("about")}
          >
            About Us
          </a>
          <a
            href="#"
            className={activeSection === "expenses" ? styles.active : ""}
            onClick={() => handleSectionChange("expenses")}
          >
            Expense Tracker
          </a>
          <a href="#" onClick={handleLogout}>
            Logout
          </a>
        </nav>
        <div
          className={`${styles.burger} ${isNavActive ? styles.toggle : ""}`}
          onClick={toggleNav}
        >
          <div className={styles.line1}></div>
          <div className={styles.line2}></div>
          <div className={styles.line3}></div>
        </div>
      </header>

      {/* Content Sections */}
      {activeSection === "home" && (
        <section className={styles.home}>
          <div className={styles.home_img}>
            <img src="/hisuka.png" alt="Renzzel" />
          </div>
          <div className={styles.home_content}>
            <h1>
              Hi, It's <span>Hisoka!</span>
            </h1>
            <h3 className={styles.typing_text}>
              I'm a <span className={styles.orange}>{text}</span>
            </h3>
            <p>
              My greatest pleasure comes when such people crumple to their knees
              and I look down upon their disbelieving faces as their plans fail.
            </p>
            <div className={styles.social_icons}>
              <a href="/">
                <i className="fa-brands fa-linkedin"></i>
              </a>
              <a href="/">
                <i className="fa-brands fa-github"></i>
              </a>
              <a href="/">
                <i className="fa-brands fa-x-twitter"></i>
              </a>
              <a href="/">
                <i className="fa-brands fa-instagram"></i>
              </a>
            </div>
            <a
              href="#"
              className={styles.btn}
              onClick={(e) => {
                e.preventDefault();
                handleSectionChange("about");
              }}
            >
              Pass us!
            </a>
          </div>
        </section>
      )}

      {activeSection === "about" && (
        <section className={styles.about}>
          <h2>About Us</h2>
          <div className={styles.about_content}>
            <p>
              Welcome to Phantom Gang's financial management platform! We are
              dedicated to helping you track and manage your expenses
              efficiently.
            </p>
            <p>
              Our mission is to provide simple yet powerful tools that make
              financial tracking accessible to everyone.
            </p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <h3>Simple Tracking</h3>
                <p>Easy-to-use interface for managing your daily expenses</p>
              </div>
              <div className={styles.feature}>
                <h3>Secure Storage</h3>
                <p>Your financial data is encrypted and stored securely</p>
              </div>
              <div className={styles.feature}>
                <h3>Smart Analytics</h3>
                <p>Gain insights into your spending patterns</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeSection === "expenses" && <ExpenseTracker />}
    </div>
  );
};

export default Home;
