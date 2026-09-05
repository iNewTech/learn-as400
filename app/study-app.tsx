'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  BookOpen,
  Search,
  Terminal,
  RotateCcw,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import raw from '@/content/chapters.json';
import { gradeQuiz, readProgress } from '@/lib/quiz';
type Question = {
  id: string;
  level: string;
  question: string;
  answer: string[];
  example?: string;
  trap?: string;
};
type Chapter = {
  id: string;
  title: string;
  group: string;
  level: string;
  summary: string;
  sources: { title: string; url: string }[];
  questions: Question[];
  quiz: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }[];
};
const chapters = raw as Chapter[];
const groups = [...new Set(chapters.map((c) => c.group))];
const key = 'learn-as400-progress-v1';
const subscribeLocation = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};
const locationSnapshot = () => {
  const value = window.location.hash.slice(1);
  return chapters.some((c) => c.id === value) ? value : chapters[0].id;
};
const subscribeStorage = (callback: () => void) => {
  window.addEventListener('storage', callback);
  window.addEventListener('learn-as400:progress', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('learn-as400:progress', callback);
  };
};
const storageSnapshot = () => {
  try {
    return localStorage.getItem(key);
  } catch {
    return '__unavailable__';
  }
};

function NavLink({
  chapter,
  active,
  passed,
  index,
  onNavigate,
}: {
  chapter: Chapter;
  active: boolean;
  passed: boolean;
  index: number;
  onNavigate: () => void;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <a
      className={`nav-link ${active ? 'active' : ''}`}
      href={`#${chapter.id}`}
      onClick={() => {
        setOpenMobile(false);
        onNavigate();
      }}
      aria-current={active ? 'page' : undefined}
    >
      <span className="nav-number">
        {passed ? <Check size={14} /> : String(index + 1).padStart(2, '0')}
      </span>
      <span>{chapter.title}</span>
    </a>
  );
}
function IndexButton({
  active,
  total,
  onNavigate,
}: {
  active: boolean;
  total: number;
  onNavigate: () => void;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <button
      className={`index-link ${active ? 'selected' : ''}`}
      onClick={() => {
        onNavigate();
        setOpenMobile(false);
      }}
    >
      <BookOpen size={17} /> Question index <span>{total}</span>
    </button>
  );
}
export default function StudyApp() {
  const id = useSyncExternalStore(
    subscribeLocation,
    locationSnapshot,
    () => chapters[0].id,
  );
  const [mode, setMode] = useState('Study guide');
  const [filter, setFilter] = useState('All levels');
  const [search, setSearch] = useState('');
  const [sessionProgress, setSessionProgress] = useState<
    Record<string, number>
  >({});
  const saved = useSyncExternalStore(
    subscribeStorage,
    storageSnapshot,
    () => null,
  );
  const progress = { ...readProgress(saved, chapters), ...sessionProgress };
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const onHash = () => setMode('Study guide');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, mode]);
  const chapter = chapters.find((c) => c.id === id) || chapters[0],
    index = chapters.indexOf(chapter);
  const completed = chapters.filter(
    (c) => progress[c.id] === c.quiz.length,
  ).length;
  const total = chapters.reduce((n, c) => n + c.questions.length, 0);
  const save = (score: number) => {
    const p = { ...progress, [id]: Math.max(progress[id] || 0, score) };
    setSessionProgress(p);
    try {
      localStorage.setItem(key, JSON.stringify(p));
      window.dispatchEvent(new Event('learn-as400:progress'));
    } catch {
      setStorageError(true);
    }
  };
  const matches = (c: Chapter) =>
    (filter === 'All levels' || c.questions.some((q) => q.level === filter)) &&
    (!search ||
      `${c.title} ${c.summary} ${c.questions.map((q) => q.question + ' ' + q.answer.join(' ')).join(' ')}`
        .toLowerCase()
        .includes(search.toLowerCase()));
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="skip"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to content
      </a>
      <Sidebar className="study-sidebar">
        <SidebarHeader>
          <a
            className="brand"
            onClick={() => setMode('Study guide')}
            href={`#${chapters[0].id}`}
          >
            <span className="brand-mark">
              <Terminal size={22} />
            </span>
            learn-as400<span className="brand-dot">.</span>
          </a>
          <div className="sidebar-caption">IBM i DEVELOPER HANDBOOK</div>
        </SidebarHeader>
        <SidebarContent>
          <IndexButton
            active={mode === 'Question index'}
            total={total}
            onNavigate={() => {
              setMode('Question index');
              setSearch('');
            }}
          />
          {groups.map((g) => (
            <div className="nav-group" key={g}>
              <h2>{g}</h2>
              {chapters
                .filter((c) => c.group === g)
                .map((c) => (
                  <NavLink
                    key={c.id}
                    chapter={c}
                    index={chapters.indexOf(c)}
                    onNavigate={() => setMode('Study guide')}
                    active={id === c.id && mode === 'Study guide'}
                    passed={progress[c.id] === c.quiz.length}
                  />
                ))}
            </div>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <div className="progress-label">
            <span>Your progress</span>
            <strong>
              {completed}/{chapters.length}
            </strong>
          </div>
          <Progress
            value={(100 * completed) / chapters.length}
            aria-label="Chapters passed"
          />
          <p className="small">Saved on this browser</p>
        </SidebarFooter>
      </Sidebar>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <SidebarTrigger />
            <span>Interview preparation</span>
            <ChevronRight size={14} />
            <strong>{mode}</strong>
          </div>
          <span className="edition">2026 EDITION</span>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="page-top">
            <div>
              <p className="eyebrow">THE IBM i INTERVIEW COMPANION</p>
              <h1>
                {mode === 'Question index'
                  ? 'Find your next question.'
                  : chapter.title}
              </h1>
              <p className="intro">
                {mode === 'Question index'
                  ? 'Explore the complete question bank by topic and difficulty.'
                  : chapter.summary}
              </p>
            </div>
            <span className="chapter-label">
              {mode === 'Question index'
                ? `${total} QUESTIONS`
                : `CHAPTER ${String(index + 1).padStart(2, '0')}`}
            </span>
          </div>
          <div className="stats">
            <div>
              <strong>{total}</strong>
              <span>explained answers</span>
            </div>
            <div>
              <strong>{chapters.length}</strong>
              <span>focused chapters</span>
            </div>
            <div>
              <strong>{chapters.reduce((n, c) => n + c.quiz.length, 0)}</strong>
              <span>quiz questions</span>
            </div>
            <div>
              <strong>{completed}</strong>
              <span>chapters passed</span>
            </div>
          </div>
          {(storageError || saved === '__unavailable__') && (
            <output className="notice">
              Browser storage is unavailable. Progress will last for this
              session only.
            </output>
          )}
          {mode === 'Question index' ? (
            <>
              <div className="searchbox">
                <Search size={20} />
                <input
                  aria-label="Search questions and answers"
                  placeholder="Search topics, commands, or interview questions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="filters" aria-label="Difficulty filter">
                {['All levels', 'Easy', 'Intermediate', 'Advanced'].map((v) => (
                  <button
                    key={v}
                    aria-pressed={filter === v}
                    className={filter === v ? 'chosen' : ''}
                    onClick={() => setFilter(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="index-grid">
                {chapters.filter(matches).map((c) => (
                  <section className="index-card" key={c.id}>
                    <div className="card-top">
                      <span className="eyebrow">{c.group}</span>
                      <span className={`badge ${c.level.toLowerCase()}`}>
                        {c.level}
                      </span>
                    </div>
                    <h2>
                      <a
                        href={`#${c.id}`}
                        onClick={() => {
                          setMode('Study guide');
                        }}
                      >
                        {c.title}
                        <ArrowRight size={18} />
                      </a>
                    </h2>
                    <p>{c.summary}</p>
                    <ul>
                      {c.questions
                        .filter(
                          (q) =>
                            (filter === 'All levels' || q.level === filter) &&
                            (!search ||
                              `${c.title} ${q.question} ${q.answer.join(' ')}`
                                .toLowerCase()
                                .includes(search.toLowerCase())),
                        )
                        .map((q) => (
                          <li key={q.id}>
                            <a
                              href={`#${c.id}`}
                              onClick={() => {
                                setMode('Study guide');
                              }}
                            >
                              {q.question}
                            </a>
                            <span>{q.level}</span>
                          </li>
                        ))}
                    </ul>
                    <div className="small">
                      {c.questions.length} answers · {c.quiz.length} MCQs{' '}
                      {progress[c.id] === c.quiz.length ? '· Passed' : ''}
                    </div>
                  </section>
                ))}
              </div>
              {!chapters.some(matches) && (
                <p className="notice">
                  No matches. Try a command name, a broader topic, or all
                  levels.
                </p>
              )}
            </>
          ) : (
            <div className="reading-layout">
              <article key={chapter.id}>
                <div className="section-head">
                  <h2>Interview questions</h2>
                  <span>
                    {chapter.questions.length} QUESTIONS · EASY → HARD
                  </span>
                </div>
                <p className="helper">
                  Try answering aloud, then expand to check your reasoning.
                </p>
                <div className="questions">
                  {chapter.questions.map((q, i) => (
                    <details key={q.id} className="question">
                      <summary>
                        <span className="q-number">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="q-title">
                          {q.question}
                          <span className={`badge ${q.level.toLowerCase()}`}>
                            {q.level}
                          </span>
                        </span>
                        <span className="expand">+</span>
                      </summary>
                      <div className="answer">
                        {q.answer.map((a, j) => (
                          <p key={j}>{a}</p>
                        ))}
                        {q.example && (
                          <pre>
                            <code>{q.example}</code>
                          </pre>
                        )}
                        {q.trap && (
                          <div className="trap">
                            <strong>Interview pitfall</strong>
                            <p>{q.trap}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
                <section className="sources">
                  <h2>IBM documentation & further reading</h2>
                  <p>
                    Original study explanations, checked against IBM
                    documentation. Research date: 5 September 2026. Feature
                    availability can depend on release and PTF level; linked
                    documentation identifies its version.
                  </p>
                  {chapter.sources.map((s) => (
                    <a
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.title} ↗
                    </a>
                  ))}
                </section>
                <Quiz
                  key={chapter.id}
                  chapter={chapter}
                  onGrade={save}
                  passed={progress[id] === chapter.quiz.length}
                />
                <div className="chapter-nav">
                  {index > 0 ? (
                    <a href={`#${chapters[index - 1].id}`}>
                      ← Previous chapter
                    </a>
                  ) : (
                    <span />
                  )}
                  {index < chapters.length - 1 ? (
                    progress[id] === chapter.quiz.length ? (
                      <a
                        className="primary"
                        href={`#${chapters[index + 1].id}`}
                      >
                        Continue: {chapters[index + 1].title}
                        <ArrowRight size={16} />
                      </a>
                    ) : (
                      <button disabled className="primary">
                        Pass the checkpoint to continue
                      </button>
                    )
                  ) : (
                    <p>
                      {progress[id] === chapter.quiz.length
                        ? 'Final chapter passed. Revisit any topic from the index.'
                        : 'Pass the final checkpoint to finish this chapter.'}
                    </p>
                  )}
                </div>
              </article>
              <aside className="study-rail">
                <div className="rail-card">
                  <span className="eyebrow">IN THIS CHAPTER</span>
                  <h3>
                    Build understanding.
                    <br />
                    Then test it.
                  </h3>
                  <div className="rail-line">
                    <BookOpen size={18} />
                    <span>{chapter.questions.length} detailed answers</span>
                  </div>
                  <div className="rail-line">
                    <Check size={18} />
                    <span>{chapter.quiz.length} practice MCQs</span>
                  </div>
                  <a
                    href="#checkpoint"
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .getElementById('checkpoint')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Jump to checkpoint <ArrowRight size={15} />
                  </a>
                </div>
                <div className="interview-note">
                  <span className="eyebrow">A STRONG ANSWER</span>
                  <p>
                    Explain what it is, when you would use it, and what can go
                    wrong.
                  </p>
                  <p className="small">
                    Use a concrete example. State your assumptions.
                  </p>
                </div>
                <p className="small rail-note">
                  Browse any topic freely. The guided Continue button requires a
                  perfect checkpoint score.
                </p>
              </aside>
            </div>
          )}
          <footer>
            learn-as400{' '}
            <span>
              Independent study guide · Not affiliated with IBM · Examples
              require adaptation to your environment.
            </span>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}
function Quiz({
  chapter,
  onGrade,
  passed,
}: {
  chapter: Chapter;
  onGrade: (n: number) => void;
  passed: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const allAnswered = Object.keys(answers).length === chapter.quiz.length;
  return (
    <section id="checkpoint" className="quiz">
      <div className="quiz-heading">
        <div>
          <p className="eyebrow">CHECKPOINT</p>
          <h2>Put your knowledge to work.</h2>
        </div>
        <span className="quiz-count">{chapter.quiz.length} MCQs</span>
      </div>
      <p>
        Answer every question. Score 100% to pass; review the explanations and
        retry as needed.{passed ? ' You have already passed this chapter.' : ''}
      </p>
      {chapter.quiz.map((q, i) => (
        <fieldset className="quiz-question" key={`${i}-${attempt}`}>
          <legend>
            <span>{i + 1}.</span> {q.question}
          </legend>
          <RadioGroup
            value={answers[i] === undefined ? null : String(answers[i])}
            onValueChange={(v) => {
              if (result === null) setAnswers({ ...answers, [i]: Number(v) });
            }}
            aria-label={q.question}
            disabled={result !== null}
          >
            {q.options.map((o, j) => (
              <label
                className={`option ${result !== null && j === q.correct ? 'correct' : ''} ${result !== null && answers[i] === j && j !== q.correct ? 'incorrect' : ''}`}
                key={o}
              >
                <RadioGroupItem value={String(j)} />
                <span>{o}</span>
              </label>
            ))}
          </RadioGroup>
          {result !== null && (
            <p
              className={`explanation ${answers[i] === q.correct ? 'good' : 'bad'}`}
            >
              <strong>
                {answers[i] === q.correct ? 'Correct.' : 'Review this.'}
              </strong>{' '}
              {q.explanation}{' '}
              <span>Correct answer: {q.options[q.correct]}</span>
            </p>
          )}
        </fieldset>
      ))}
      <div className="quiz-actions">
        {result === null ? (
          <button
            className="primary"
            disabled={!allAnswered}
            onClick={() => {
              const n = gradeQuiz(chapter.quiz, answers);
              setResult(n);
              onGrade(n);
            }}
          >
            Check answers
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            className="secondary"
            onClick={() => {
              setAnswers({});
              setResult(null);
              setAttempt(attempt + 1);
            }}
          >
            <RotateCcw size={16} /> Try again
          </button>
        )}
        <output aria-live="polite">
          {result !== null
            ? `${result}/${chapter.quiz.length} · ${result === chapter.quiz.length ? 'Checkpoint passed!' : 'Review and retry to pass.'}`
            : `${Object.keys(answers).length}/${chapter.quiz.length} answered`}
        </output>
      </div>
    </section>
  );
}
