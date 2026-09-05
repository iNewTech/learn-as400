'use client';
import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
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
import { gradeQuiz, readProgress } from '@/lib/quiz';
import { matchesQuestion } from '@/lib/search';
type Question = {
  id: string;
  level: string;
  question: string;
  answer: string[];
  example?: string;
  fixedFormat?: string;
  freeFormat?: string;
  fixedLabel?: string;
  freeLabel?: string;
  topic?: string;
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
type LessonCode = {
  label: string;
  language: string;
  fixed?: string;
  free?: string;
};
type LessonSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  command?: { label: string; code: string };
  code?: LessonCode;
  flow?: string[];
};
type Lesson = {
  id: string;
  title: string;
  level: string;
  chapterIds: string[];
  outcomes: string[];
  sections: LessonSection[];
};
const key = 'learn-as400-progress-v1';
const subscribeLocation = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
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
function LearningButton({
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
      <BookOpen size={17} /> Learning path <span>{total}</span>
    </button>
  );
}
function StudyAppContent({
  chapters,
  lessons,
}: {
  chapters: Chapter[];
  lessons: Lesson[];
}) {
  const groups = [...new Set(chapters.map((chapter) => chapter.group))];
  const locationSnapshot = () => {
    const value = window.location.hash.slice(1);
    return chapters.some((chapter) => chapter.id === value)
      ? value
      : chapters[0].id;
  };
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
  const questionMatches = (c: Chapter, q: Question) =>
    matchesQuestion(c, q, search, filter);
  const matches = (c: Chapter) =>
    c.questions.some((q) => questionMatches(c, q));
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
          <LearningButton
            active={mode === 'Learning path'}
            total={lessons.length}
            onNavigate={() => {
              setMode('Learning path');
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
            <span>Learning &amp; interview guide</span>
            <ChevronRight size={14} />
            <strong>{mode}</strong>
          </div>
          <span className="edition">2026 EDITION</span>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="page-top">
            <div>
              <p className="eyebrow">THE IBM i LEARNING &amp; INTERVIEW GUIDE</p>
              <h1>
                {mode === 'Question index'
                  ? 'Find your next question.'
                  : mode === 'Learning path'
                    ? 'Learn IBM i, one mental model at a time.'
                    : chapter.title}
              </h1>
              <p className="intro">
                {mode === 'Question index'
                  ? 'Explore the complete question bank by topic and difficulty.'
                  : mode === 'Learning path'
                    ? 'Short, plain-English lessons connect IBM i concepts to commands, code, production habits, and the deeper question bank.'
                    : chapter.summary}
              </p>
            </div>
            <span className="chapter-label">
              {mode === 'Question index'
                ? `${total} QUESTIONS`
                : mode === 'Learning path'
                  ? `${lessons.length} LESSONS`
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
                        .filter((q) => questionMatches(c, q))
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
          ) : mode === 'Learning path' ? (
            <LearningPath lessons={lessons} chapters={chapters} />
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
                          {q.topic && <span className="question-topic">{q.topic}</span>}
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
                        {(q.fixedFormat || q.freeFormat) && (
                          <div className="code-pairs">
                            {q.fixedFormat && (
                              <div>
                                <strong>{q.fixedLabel || 'Fixed-format RPG'}</strong>
                                <pre><code>{q.fixedFormat}</code></pre>
                              </div>
                            )}
                            {q.freeFormat && (
                              <div>
                                <strong>{q.freeLabel || 'Fully free RPG'}</strong>
                                <pre><code>{q.freeFormat}</code></pre>
                              </div>
                            )}
                          </div>
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
          <footer className="site-footer">
            <div className="footer-brand">learn-as400</div>
            <div className="footer-copy">
              <p>
                Independent study guide · Not affiliated with IBM. Content is
                provided for learning and interview preparation. Please verify
                every technical detail against current official IBM
                documentation and your target IBM i release before implementing
                it.
              </p>
              <p>
                The site owner is not responsible for losses, outages, data
                changes, security issues, or other outcomes resulting from use
                of this information. Examples require adaptation and testing in
                your environment.
              </p>
              <p>
                Contact:{' '}
                <a href="mailto:gajedertyagi.tyagi@gmail.com">
                  gajedertyagi.tyagi@gmail.com
                </a>
                {' · '}
                <a
                  href="mailto:gajedertyagi.tyagi@gmail.com?subject=learn%20as400%20feedback&body=Please%20share%20your%20feedback%20about%20learn-as400%3A%0A%0A"
                >
                  Send feedback
                </a>
              </p>
            </div>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}
const StudyContent = lazy(async () => {
  const data = await import('./study-data');
  return {
    default: () => (
      <StudyAppContent
        chapters={data.chapters as Chapter[]}
        lessons={data.lessons as Lesson[]}
      />
    ),
  };
});
export default function StudyApp() {
  return (
    <Suspense
      fallback={
        <main className="app-loading" aria-busy="true">
          <p className="eyebrow">THE IBM i LEARNING GUIDE</p>
          <h1>Learn IBM i.<br />Build with confidence.</h1>
          <p>Loading the question bank and learning path…</p>
        </main>
      }
    >
      <StudyContent />
    </Suspense>
  );
}
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, index) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code key={index}>{part.slice(1, -1)}</code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
function LearningPath({
  lessons: lessonList,
  chapters: chapterList,
}: {
  lessons: Lesson[];
  chapters: Chapter[];
}) {
  const [activeId, setActiveId] = useState(lessonList[0]?.id || '');
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const lesson = lessonList.find((item) => item.id === activeId) || lessonList[0];
  if (!lesson) return null;
  const related = lesson.chapterIds
    .map((chapterId) => chapterList.find((chapter) => chapter.id === chapterId))
    .filter((chapter): chapter is Chapter => Boolean(chapter));
  const checkpointQuiz = related
    .flatMap((chapter) => chapter.quiz)
    .slice(0, 5);
  const checkpoint: Chapter = {
    ...(related[0] || chapterList[0]),
    id: `lesson-${lesson.id}`,
    title: `${lesson.title} checkpoint`,
    questions: [],
    quiz: checkpointQuiz,
  };
  const lessonIndex = lessonList.indexOf(lesson);
  const previous = lessonList[lessonIndex - 1];
  const next = lessonList[lessonIndex + 1];
  const references = Array.from(
    new Map(
      related
        .flatMap((chapter) => chapter.sources)
        .map((source) => [source.url, source]),
    ).values(),
  );
  return (
    <div className="learning-layout">
      <aside className="lesson-menu" aria-label="Learning path lessons">
        <div className="lesson-menu-head">
          <span className="eyebrow">LEARNING PATH</span>
          <p>Build the platform model, then practise the production decisions.</p>
        </div>
        <div className="lesson-list">
          {lessonList.map((item, index) => (
            <button
              key={item.id}
              className={`lesson-link ${item.id === lesson.id ? 'active' : ''}`}
              onClick={() => setActiveId(item.id)}
              aria-current={item.id === lesson.id ? 'page' : undefined}
            >
              <span className="lesson-number">
                {passed[item.id] ? <Check size={14} /> : String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.level}</small>
              </span>
            </button>
          ))}
        </div>
      </aside>
      <article className="lesson-content" key={lesson.id}>
        <div className="lesson-heading">
          <div>
            <p className="eyebrow">LESSON {String(lessonIndex + 1).padStart(2, '0')}</p>
            <h2>{lesson.title}</h2>
            <p className="helper">
              Read the notes, try the commands in a safe environment, then pass
              the five-question checkpoint.
            </p>
          </div>
          <span className={`badge ${lesson.level.toLowerCase()}`}>{lesson.level}</span>
        </div>
        <section className="lesson-outcomes">
          <strong>After this lesson</strong>
          <ul>
            {lesson.outcomes.map((outcome) => (
              <li key={outcome}><RichText text={outcome} /></li>
            ))}
          </ul>
          <div className="lesson-chapters">
            <span>Question chapters:</span>
            {related.map((chapter) => (
              <a key={chapter.id} href={`#${chapter.id}`}>
                {chapter.title} <ArrowRight size={14} />
              </a>
            ))}
          </div>
        </section>
        <div className="lesson-sections">
          {lesson.sections.map((section, index) => (
            <section className="learning-section" key={section.heading}>
              <div className="learning-section-heading">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{section.heading}</h3>
              </div>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}><RichText text={paragraph} /></p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}><RichText text={bullet} /></li>
                  ))}
                </ul>
              )}
              {section.command && (
                <div className="lesson-code-block">
                  <strong>{section.command.label}</strong>
                  <pre><code>{section.command.code}</code></pre>
                </div>
              )}
              {section.code && (
                <div className="lesson-code-block">
                  <strong>{section.code.label}</strong>
                  {section.code.fixed && section.code.free ? (
                    <div className="code-pairs">
                      <div>
                        <span className="code-label">Fixed format</span>
                        <pre><code>{section.code.fixed}</code></pre>
                      </div>
                      <div>
                        <span className="code-label">Fully free</span>
                        <pre><code>{section.code.free}</code></pre>
                      </div>
                    </div>
                  ) : (
                    <pre><code>{section.code.free || section.code.fixed}</code></pre>
                  )}
                </div>
              )}
              {section.flow && (
                <ol className="lesson-flow">
                  {section.flow.map((step) => <li key={step}>{step}</li>)}
                </ol>
              )}
            </section>
          ))}
        </div>
        <section className="sources lesson-sources">
          <h2>IBM documentation for this path</h2>
          <p>
            These links are the primary references for the concepts above.
            Release and PTF behavior can differ, so verify the version that
            matches your partition before implementing a change.
          </p>
          {references.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.title} ↗
            </a>
          ))}
        </section>
        {checkpointQuiz.length > 0 && (
          <Quiz
            key={lesson.id}
            chapter={checkpoint}
            onGrade={(score) => {
              if (score === checkpoint.quiz.length) {
                setPassed({ ...passed, [lesson.id]: true });
              }
            }}
            passed={Boolean(passed[lesson.id])}
          />
        )}
        <div className="chapter-nav lesson-nav">
          {previous ? (
            <button className="secondary" onClick={() => setActiveId(previous.id)}>
              ← Previous lesson
            </button>
          ) : <span />}
          {next ? (
            <button
              className="primary"
              disabled={!passed[lesson.id]}
              onClick={() => setActiveId(next.id)}
              title={!passed[lesson.id] ? 'Pass this lesson checkpoint first' : undefined}
            >
              Continue: {next.title} <ArrowRight size={16} />
            </button>
          ) : (
            <p>{passed[lesson.id] ? 'Learning path complete. Use the question index for deeper practice.' : 'Pass this checkpoint to finish the path.'}</p>
          )}
        </div>
      </article>
    </div>
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
