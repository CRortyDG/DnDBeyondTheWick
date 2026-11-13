"use client";

import { useEffect, useRef, useState } from "react";
import { QUIZ, quizPick, STARTERS, type Starter, type StarterId } from "@/shared/starters";

/** Six starting points in plain words, plus three questions for anyone who can't choose. */
export function Starters({ current, onChoose, onBack }: { current: StarterId | null; onChoose: (s: Starter) => void; onBack: () => void }) {
  const [answers, setAnswers] = useState<number[] | null>(null);
  const [suggested, setSuggested] = useState<StarterId | null>(null);
  const top = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    top.current?.focus();
  }, []);

  useEffect(() => {
    if (suggested) document.getElementById(`starter-${suggested}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [suggested]);

  const step = answers?.length ?? 0;

  return (
    <main className="seat-page starters">
      <h1 ref={top} tabIndex={-1}>
        Who could you be?
      </h1>
      <p className="seat-note">
        Pick whichever sounds most fun. There&rsquo;s no wrong answer, and you can change your mind before the game.
      </p>

      {answers === null ? (
        <button type="button" className="seat-btn" onClick={() => (setAnswers([]), setSuggested(null))}>
          Help me choose
        </button>
      ) : step < QUIZ.length ? (
        <section className="quiz" aria-live="polite">
          <p className="quiz-count">
            Question {step + 1} of {QUIZ.length}
          </p>
          <h2>{QUIZ[step].q}</h2>
          {QUIZ[step].a.map((label, i) => (
            <button
              key={label}
              type="button"
              className="seat-btn"
              onClick={() => {
                const next = [...answers, i];
                setAnswers(next);
                if (next.length === QUIZ.length) setSuggested(quizPick(next));
              }}
            >
              {label}
            </button>
          ))}
          <button type="button" className="seat-link" onClick={() => setAnswers(null)}>
            Skip the questions
          </button>
        </section>
      ) : (
        <p className="seat-note" aria-live="polite">
          You might like <strong>{STARTERS.find((s) => s.id === suggested)?.title}</strong>. It&rsquo;s marked below.{" "}
          <button type="button" className="seat-link inline" onClick={() => (setAnswers([]), setSuggested(null))}>
            Ask again
          </button>
        </p>
      )}

      <ul className="starter-list">
        {STARTERS.map((s) => (
          <li key={s.id} id={`starter-${s.id}`} className={`starter-card${s.id === suggested ? " suggested" : ""}${s.id === current ? " current" : ""}`}>
            {s.id === suggested ? <p className="starter-tag">Suggested for you</p> : s.id === current ? <p className="starter-tag">Your pick</p> : null}
            <h2>{s.title}</h2>
            <p className="starter-feel">{s.feel}</p>
            <p>
              <span className="starter-label">On your turn:</span> {s.turn}
            </p>
            <p className="starter-dnd">
              In D&amp;D Beyond: {s.dnd.cls} · {s.dnd.species} · {s.dnd.background}
            </p>
            <button type="button" className="seat-btn primary" onClick={() => onChoose(s)}>
              Be {s.title.replace(/^The /, "the ")}
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="seat-link" onClick={onBack}>
        Back
      </button>
    </main>
  );
}
