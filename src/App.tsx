import { useState } from "react";
import Quiz from "./components/Quiz";
import Propostas from "./components/Propostas";

type Tab = "quiz" | "propostas";

export default function App() {
  const [tab, setTab] = useState<Tab>("quiz");

  return (
    <div className="shell">
      <header className="masthead">
        <div className="logo" onClick={() => setTab("quiz")} role="button">
          <span className="logo-badge">
            Presi<em>Tinder</em>
          </span>
          <span className="logo-year">2026</span>
        </div>
        <nav className="tabs">
          <button
            className={`tab ${tab === "quiz" ? "active" : ""}`}
            onClick={() => setTab("quiz")}
          >
            Quiz
          </button>
          <button
            className={`tab ${tab === "propostas" ? "active" : ""}`}
            onClick={() => setTab("propostas")}
          >
            Propostas
          </button>
        </nav>
      </header>

      {tab === "quiz" ? <Quiz /> : <Propostas />}

      <p className="footnote">
        Análise independente baseada exclusivamente nos planos de governo
        oficiais registrados no{" "}
        <a
          href="https://divulgacandcontas.tse.jus.br/divulga/#/candidato/BR/BR/20322002026"
          target="_blank"
          rel="noreferrer"
        >
          TSE (DivulgaCandContas)
        </a>
        . Este site não tem filiação partidária e não substitui a leitura dos
        planos.
      </p>
    </div>
  );
}
