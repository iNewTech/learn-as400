'use client';
import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  BookOpen,
  BookMarked,
  Code2,
  GraduationCap,
  Layers3,
  Map as MapIcon,
  Search,
  ShieldCheck,
  Terminal,
  Trophy,
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
import { lessonQuiz } from '@/lib/learning.mjs';
import { reviewDraft } from '@/lib/workspace.mjs';
import { CaseWorkshop, PracticeNotice, References, TestNotebook, type Scenario, type Challenge, type PracticeQuestion } from './practice-workshop';
import { ReferenceHub, type ReferenceData } from './reference-hub';
type Question = {
  id: string;
  level: string;
  question: string;
  answer: string[];
  example?: string;
  exampleLabel?: string;
  fixedFormat?: string;
  freeFormat?: string;
  fixedLabel?: string;
  freeLabel?: string;
  topic?: string;
  category?: string;
  diagnosticSteps?: { title: string; detail: string; command?: string }[];
  verification?: string;
  trap?: string;
  requirements?: string[];
  testCases?: string[];
  hints?: string[];
  sources?: { title: string; url: string }[];
};
type Chapter = {
  id: string;
  title: string;
  group: string;
  level: string;
  summary: string;
  sources: { title: string; url: string }[];
  questions: Question[];
  quiz: PracticeQuestion[];
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
const labKey = 'learn-as400-lab-progress-v1';
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
const labStorageSnapshot = () => {
  try {
    return localStorage.getItem(labKey);
  } catch {
    return '__unavailable__';
  }
};
const readLabProgress = (raw: string | null, ids: string[]) => {
  if (!raw) return {} as Record<string, boolean>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {} as Record<string, boolean>;
    return Object.fromEntries(ids.filter((id) => parsed[id] === true).map((id) => [id, true]));
  } catch {
    return {} as Record<string, boolean>;
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
function StudyIndexes({ chapters, lessons, scenarios, issueSections, mode, activeId, activeLesson, progress, labCompleted }: {
  chapters: Chapter[]; lessons: Lesson[]; scenarios: Scenario[]; issueSections: { id: string; category: string; quiz: PracticeQuestion[] }[]; mode: string; activeId: string;
  activeLesson: string; progress: Record<string, number>; labCompleted: number;
}) {
  const { setOpenMobile } = useSidebar();
  const close = () => setOpenMobile(false);
  const questions = chapters.filter((chapter) => chapter.id !== 'coding-exercises' && chapter.id !== 'common-issues');
  const common = chapters.find((chapter) => chapter.id === 'common-issues');
  const lab = chapters.find((chapter) => chapter.id === 'coding-exercises');
  const groups = [...new Set(questions.map((chapter) => chapter.group))];
  const selectedSection = (mode === 'Learning path' || mode === 'Scenario workshop') ? 'Learning paths' : mode === 'Common issues' ? 'Common issues' : (mode === 'Code lab' || mode === 'Code drills') ? 'Code lab' : mode === 'SQL & files' ? 'SQL & files' : mode === 'Study guide' || mode === 'Question index' ? 'Questions' : '';
  const [expanded, setExpanded] = useState<string[]>(selectedSection ? [selectedSection] : []);
  const toggle = (section: string) => setExpanded((current) => current.includes(section) ? [] : [section]);
  const questionPassed = questions.filter((chapter) => progress[chapter.id] === chapter.quiz.length).length;
  const lessonsPassed = lessons.filter((lesson) => progress[`lesson-${lesson.id}`] === 5).length;
  return (
    <nav aria-label="Study sections">
      {['Questions', 'Learning paths', 'Common issues', 'Code lab', 'SQL & files'].map((section, sectionIndex) => {
        const selected = section === 'Learning paths' ? (mode === 'Learning path' || mode === 'Scenario workshop')
          : section === 'Common issues' ? mode === 'Common issues'
            : section === 'Code lab' ? (mode === 'Code lab' || mode === 'Code drills')
            : section === 'SQL & files' ? mode === 'SQL & files'
            : mode === 'Study guide' || mode === 'Question index';
        const count = sectionIndex === 0 ? chapters.reduce((n, chapter) => n + chapter.questions.length, 0)
          : sectionIndex === 1 ? lessons.length + scenarios.length : sectionIndex === 2 ? common?.questions.length || 0 : sectionIndex === 3 ? lab?.questions.length || 0 : 4;
        return (
          <section className="sidebar-index" key={section}>
            <div className={`sidebar-index-heading ${selected ? 'selected' : ''}`}>
              <a href={sectionIndex === 0 ? '#questions' : sectionIndex === 1 ? `#learn/${activeLesson}` : sectionIndex === 2 ? '#common-issues' : sectionIndex === 3 ? '#coding-exercises' : '#sql-file-ops/sql'} onClick={() => {
                setExpanded([section]);
                close();
              }}>
                {sectionIndex === 3 ? <Terminal size={18} /> : <BookOpen size={18} />}
                <span>{section}<small>{sectionIndex === 0 ? `${questionPassed}/${questions.length} checkpoints passed`
                  : sectionIndex === 1 ? `${lessonsPassed}/${lessons.length} paths · ${scenarios.filter((item) => progress[item.id] === item.quiz.length).length}/${scenarios.length} cases passed`
                    : sectionIndex === 2 ? `${issueSections.filter((item) => progress[item.id] === item.quiz.length).length}/${issueSections.length} topic checkpoints passed`
                      : sectionIndex === 3 ? `${labCompleted}/${lab?.questions.length || 0} drafts checked · ${progress['coding-exercises'] || 0}/${lab?.quiz.length || 0} MCQs` : 'Db2 course · RPG opcodes · comparisons'}</small></span>
                <span className="sidebar-count">{count}</span>
              </a>
              <button aria-label={`${expanded.includes(section) ? 'Collapse' : 'Expand'} ${section} index`}
                aria-expanded={expanded.includes(section)} aria-controls={`section-index-${sectionIndex}`} onClick={() => toggle(section)}>
                <ChevronRight size={17} className={expanded.includes(section) ? 'rotated' : ''} />
              </button>
            </div>
            <div id={`section-index-${sectionIndex}`} hidden={!expanded.includes(section)}>
              {sectionIndex === 0 ? groups.map((group) => (
                <div className="nav-group" key={group}>
                  <h2>{group}</h2>
                  {questions.filter((chapter) => chapter.group === group).map((chapter) => (
                    <NavLink key={chapter.id} chapter={chapter} index={questions.indexOf(chapter)}
                      active={mode === 'Study guide' && chapter.id === activeId}
                      passed={progress[chapter.id] === chapter.quiz.length} onNavigate={close} />
                  ))}
                </div>
              )) : sectionIndex === 1 ? <>{lessons.map((lesson, index) => (
                <a key={lesson.id} href={`#learn/${lesson.id}`} onClick={close}
                  className={`nav-link ${mode === 'Learning path' && activeLesson === lesson.id ? 'active' : ''}`}
                  aria-current={mode === 'Learning path' && activeLesson === lesson.id ? 'page' : undefined}>
                  <span className="nav-number">{progress[`lesson-${lesson.id}`] === 5 ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span>
                  <span>{lesson.title}</span>
                </a>
              ))}<div className="nav-group"><h2>Scenario workshop</h2><a className="nav-link" href="#scenarios" onClick={close}>Explore all case files →</a>{scenarios.map((item) => <a className="nav-link" href={`#scenarios/${item.id}`} key={item.id} onClick={close}><span className="nav-number">{progress[item.id] === item.quiz.length ? '✓' : '↳'}</span><span>{item.title}<small className="nav-level">{item.area}</small></span></a>)}</div></> : sectionIndex === 2 ? <>
                {common && <NavLink chapter={common} index={0} active={mode === 'Common issues'} passed={progress[common.id] === common.quiz.length} onNavigate={close} />}
                {issueSections.map((item) => <a key={item.id} href={`#common-issues/${item.id}`} className="nav-link" onClick={close}><span className="nav-number">{progress[item.id] === item.quiz.length ? '✓' : '↳'}</span><span>{item.category}</span></a>)}
              </> : sectionIndex === 3 ? <>
                <a className="nav-link" href="#code-drills" onClick={close}>Decision drills · evaluate your reasoning →</a>
                <a className="nav-link" href="#coding-exercises" onClick={close}>Explore all exercises →</a>
                {lab?.questions.map((question, index) => (
                  <a key={question.id} className="nav-link" href={`#coding-exercises/${question.id}`} onClick={close} aria-label={`Open exercise ${index + 1}: ${question.question}`}>
                    <span className="nav-number">{String(index + 1).padStart(2, '0')}</span>
                    <span>{question.question}<small className="nav-level">{question.topic || 'Code exercise'} · {question.level}</small></span>
                  </a>
                ))}
              </> : <>
                <a className="nav-link" href="#sql-file-ops/sql" onClick={close}><span className="nav-number">01</span><span>Db2 for i course<small className="nav-level">Beginner → advanced</small></span></a>
                <a className="nav-link" href="#sql-file-ops/files" onClick={close}><span className="nav-number">02</span><span>RPG file opcodes<small className="nav-level">One-page lookup</small></span></a>
                <a className="nav-link" href="#sql-file-ops/compare" onClick={close}><span className="nav-number">03</span><span>RPG ↔ SQL comparison<small className="nav-level">Choose by intent</small></span></a>
                <a className="nav-link" href="#sql-file-ops/errors" onClick={close}><span className="nav-number">04</span><span>Error handling<small className="nav-level">Symptoms → evidence</small></span></a>
              </>}
            </div>
              </section>
        );
      })}
    </nav>
  );
}

function LandingPage({ chapters, lessons, completed, checkpoints }: {
  chapters: Chapter[];
  lessons: Lesson[];
  completed: number;
  checkpoints: number;
}) {
  const questionChapters = chapters.filter((chapter) => chapter.id !== 'coding-exercises' && chapter.id !== 'common-issues');
  const questionCount = questionChapters.reduce((count, chapter) => count + chapter.questions.length, 0);
  const lab = chapters.find((chapter) => chapter.id === 'coding-exercises');
  const labCount = lab?.questions.length || 0;
  const quizCount = chapters.reduce((count, chapter) => count + chapter.quiz.length, 0);
  const progress = checkpoints ? Math.round((completed / checkpoints) * 100) : 0;
  const featureCards = [
    {
      icon: <MapIcon size={22} />,
      label: 'LEARNING PATHS',
      title: 'Start with a clear route',
      body: 'Nine guided paths turn IBM i fundamentals, Db2, RPG, CL, jobs, and production work into short lessons.',
      href: '#learn/platform-foundations',
      action: 'Start learning',
    },
    {
      icon: <BookMarked size={22} />,
      label: 'QUESTION BANK',
      title: 'Study the questions that matter',
      body: `Browse ${questionCount} topic-organised questions from easy foundations to advanced system and scenario discussions.`,
      href: '#questions',
      action: 'Browse questions',
    },
    {
      icon: <ShieldCheck size={22} />,
      label: 'COMMON ISSUES',
      title: 'Troubleshoot with evidence',
      body: `Work through ${chapters.find((item) => item.id === 'common-issues')?.questions.length || 0} incident guides with diagnostic steps, pitfalls, and a way to verify the result.`,
      href: '#common-issues',
      action: 'Open issue playbook',
    },
    {
      icon: <Code2 size={22} />,
      label: 'RPGLE + CLLE CODE LAB',
      title: 'Write, check, and improve',
      body: `${labCount} real-world exercises include fixed and fully free RPGLE, CLLE tasks, requirements, hints, and test cases.`,
      href: '#coding-exercises',
      action: 'Open code lab',
    },
  ];
  return (
    <div className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="eyebrow">THE IBM i LEARNING &amp; INTERVIEW GUIDE</p>
          <h1 id="landing-title">Learn IBM i.<br /><span>Build with confidence.</span></h1>
          <p className="landing-lede">
            A practical, plain-English guide for IBM i and AS400 developers. Learn the platform, practise the code, and explain your decisions clearly in production or an interview.
          </p>
          <div className="landing-actions">
            <a className="primary landing-primary" href="#learn/platform-foundations">Start the learning path <ArrowRight size={17} /></a>
            <a className="landing-secondary" href="#questions">Explore the question bank <ArrowRight size={16} /></a>
          </div>
          <p className="landing-note"><ShieldCheck size={15} /> IBM documentation links · browser-saved progress · free to use</p>
        </div>
        <div className="landing-hero-card" aria-label="Your study workbench">
          <div className="landing-card-kicker"><Terminal size={15} /> YOUR STUDY WORKBENCH</div>
          <h2>One place to learn, practise, and check your thinking.</h2>
          <div className="landing-flow">
            <div><span>01</span><strong>Learn the mental model</strong><small>Plain-English lessons and commands</small></div>
            <div><span>02</span><strong>Try a real scenario</strong><small>RPGLE and CLLE code exercises</small></div>
            <div><span>03</span><strong>Prove your understanding</strong><small>MCQs and saved checkpoints</small></div>
          </div>
          <div className="landing-progress-head"><span>Your progress</span><strong>{completed}/{checkpoints} checkpoints</strong></div>
          <Progress value={progress} aria-label="Study progress" />
        </div>
      </section>

      <section className="landing-stats" aria-label="Guide coverage">
        <div><strong>{questionCount}</strong><span>explained questions</span></div>
        <div><strong>{labCount}</strong><span>RPGLE + CLLE exercises</span></div>
        <div><strong>{lessons.length}</strong><span>guided learning paths</span></div>
        <div><strong>{quizCount}</strong><span>practice MCQs</span></div>
      </section>

      <section className="landing-section" aria-labelledby="landing-choose-title">
        <div className="landing-section-heading">
          <div><p className="eyebrow">CHOOSE YOUR NEXT STEP</p><h2 id="landing-choose-title">A study guide that follows your day.</h2></div>
          <p>Move between lessons, questions, and code whenever you need a different kind of practice.</p>
        </div>
        <div className="landing-feature-grid">
          {featureCards.map((card) => (
            <article className="landing-feature" key={card.label}>
              <div className="landing-feature-icon">{card.icon}</div>
              <p className="landing-card-kicker">{card.label}</p>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <a href={card.href}>{card.action} <ArrowRight size={15} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-path-section" aria-labelledby="landing-paths-title">
        <div className="landing-section-heading">
          <div><p className="eyebrow">THE LEARNING PATH</p><h2 id="landing-paths-title">From first principles to production judgement.</h2></div>
          <a className="landing-text-link" href="#learn/platform-foundations">Open all paths <ArrowRight size={15} /></a>
        </div>
        <div className="landing-path-grid">
          {lessons.map((lesson, index) => (
            <a className="landing-path-card" href={`#learn/${lesson.id}`} key={lesson.id}>
              <span className="landing-path-number">{String(index + 1).padStart(2, '0')}</span>
              <span><strong>{lesson.title}</strong><small>{lesson.level} · 5-question checkpoint</small></span>
              <ChevronRight size={16} />
            </a>
          ))}
        </div>
      </section>

      <section className="landing-principles" aria-labelledby="landing-principles-title">
        <div className="landing-principles-copy">
          <p className="eyebrow">BUILT FOR REAL IBM i WORK</p>
          <h2 id="landing-principles-title">Understand the why behind the command.</h2>
          <p>Every topic connects platform behaviour to an example, a trade-off, and the next question an interviewer or teammate may ask.</p>
        </div>
        <div className="landing-principles-list">
          <div><GraduationCap size={18} /><span><strong>Learn simply</strong><small>Short lessons before deep references.</small></span></div>
          <div><Layers3 size={18} /><span><strong>Practise deliberately</strong><small>Requirements and test cases for every lab.</small></span></div>
          <div><Trophy size={18} /><span><strong>Track your proof</strong><small>Checkpoints stay saved in this browser.</small></span></div>
        </div>
      </section>

      <section className="landing-final-cta" aria-labelledby="landing-cta-title">
        <div><p className="eyebrow">READY WHEN YOU ARE</p><h2 id="landing-cta-title">Start with the platform. Keep going at your pace.</h2></div>
        <a className="primary landing-primary" href="#learn/platform-foundations">Begin IBM i foundations <ArrowRight size={17} /></a>
      </section>
    </div>
  );
}

function StudyAppContent({
  chapters,
  lessons, scenarios, challenges, issueSections, referenceData,
}: {
  chapters: Chapter[];
  lessons: Lesson[];
  scenarios: Scenario[]; challenges: Challenge[];
  issueSections: { id: string; category: string; quiz: PracticeQuestion[] }[];
  referenceData: ReferenceData;
}) {
  const hash = useSyncExternalStore(subscribeLocation, () => window.location.hash.slice(1), () => '');
  const mode = hash === '' || hash === 'home' ? 'Home' : hash === 'questions' ? 'Question index' : hash.startsWith('common-issues') ? 'Common issues' : hash.startsWith('scenarios') ? 'Scenario workshop' : hash === 'code-drills' ? 'Code drills' : hash.startsWith('sql-file-ops') ? 'SQL & files' : hash.startsWith('learn/') ? 'Learning path'
    : hash.startsWith('coding-exercises') ? 'Code lab' : 'Study guide';
  const id = chapters.some((chapter) => chapter.id === hash.split('/')[0]) ? hash.split('/')[0] : chapters[0].id;
  const activeLesson = lessons.find((lesson) => lesson.id === hash.split('/')[1])?.id || lessons[0].id;
  const exerciseId = mode === 'Code lab' ? hash.split('/')[1] : undefined;
  const questionChapters = chapters.filter((chapter) => chapter.id !== 'coding-exercises' && chapter.id !== 'common-issues');
  const allQuestions = chapters.reduce((count, chapter) => count + chapter.questions.length, 0);
  const drillChapter = { id: 'code-drills', title: 'Code decision drills', quiz: challenges.map((item) => ({ ...item, question: `${item.title}: ${item.prompt}` })) };
  const checkpoints = [...chapters, ...issueSections, ...scenarios, drillChapter, ...lessons.map((lesson) => ({ id: `lesson-${lesson.id}`, quiz: lessonQuiz(lesson, chapters) }))];
  const setMode = (next: string) => {
    window.location.hash = next === 'Home' ? 'home' : next === 'Question index' ? 'questions' : next === 'Learning path' ? `learn/${activeLesson}` : id;
  };
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
  const labSaved = useSyncExternalStore(
    subscribeStorage,
    labStorageSnapshot,
    () => null,
  );
  const [storageError, setStorageError] = useState(false);
  const labChapter = chapters.find((chapter) => chapter.id === 'coding-exercises');
  const labIds = labChapter?.questions.map((question) => question.id) || [];
  const [labSession, setLabSession] = useState<Record<string, boolean>>({});
  const labProgress = { ...readLabProgress(labSaved, labIds), ...labSession };
  const markLabExercise = (exerciseId: string) => {
    if (labProgress[exerciseId]) return;
    const next = { ...labProgress, [exerciseId]: true };
    setLabSession(next);
    try {
      localStorage.setItem(labKey, JSON.stringify(next));
      window.dispatchEvent(new Event('learn-as400:progress'));
    } catch {
      setStorageError(true);
    }
  };
  const progress = { ...readProgress(saved, checkpoints), ...sessionProgress };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hash]);
  const sourceChapter = chapters.find((c) => c.id === id) || chapters[0];
  const issueSection = mode === 'Common issues' ? issueSections.find((item) => item.id === hash.split('/')[1]) : undefined;
  const chapter = issueSection ? { ...sourceChapter, id: issueSection.id, title: issueSection.category, questions: sourceChapter.questions.filter((q) => q.category === issueSection.category), quiz: issueSection.quiz } : sourceChapter;
  const index = chapters.indexOf(sourceChapter);
  const completed = checkpoints.filter(
    (c) => progress[c.id] === c.quiz.length,
  ).length;
  const total = chapters.reduce((n, c) => n + c.questions.length, 0);
  const save = (score: number, checkpointId = id) => {
    const p = { ...progress, [checkpointId]: Math.max(progress[checkpointId] || 0, score) };
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
            onClick={() => setMode('Home')}
            href="#home"
          >
            <span className="brand-mark">
              <Terminal size={22} />
            </span>
            learn-as400<span className="brand-dot">.</span>
          </a>
          <div className="sidebar-caption">IBM i DEVELOPER HANDBOOK</div>
        </SidebarHeader>
        <SidebarContent>
          <StudyIndexes chapters={chapters} lessons={lessons} mode={mode} activeId={id}
            activeLesson={activeLesson} progress={progress} scenarios={scenarios} issueSections={issueSections}
            labCompleted={Object.keys(labProgress).length} />
        </SidebarContent>
        <SidebarFooter>
          <div className="progress-label">
            <span>Checkpoints passed</span>
            <strong>
              {completed}/{checkpoints.length}
            </strong>
          </div>
          <Progress
            value={(100 * completed) / checkpoints.length}
            aria-label="Checkpoints passed"
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
          {mode !== 'Home' && <div className="page-top">
            <div>
              <p className="eyebrow">THE IBM i LEARNING &amp; INTERVIEW GUIDE</p>
              <h1>
                {mode === 'Question index'
                  ? 'Find your next question.'
                  : mode === 'Learning path'
                    ? 'Learn IBM i, one mental model at a time.'
                    : mode === 'Scenario workshop' ? 'Think like the person on call.' : mode === 'Code drills' ? 'Read the code. Predict the outcome.' : chapter.title}
              </h1>
              <p className="intro">
                {mode === 'Question index'
                  ? 'Explore the complete question bank by topic and difficulty.'
                  : mode === 'Learning path'
                    ? 'Short, plain-English lessons connect IBM i concepts to commands, code, production habits, and the deeper question bank.'
                    : mode === 'Scenario workshop' ? 'File operations, SQL, jobs, and ILE: investigate a symptom, follow the right branch, and check your understanding.' : mode === 'Code drills' ? 'Complete the code and reason about boundary and failure cases. These drills grade your selected answer; they do not execute RPG or CL.' : chapter.summary}
              </p>
            </div>
            <span className="chapter-label">
              {mode === 'Question index'
                ? `${total} QUESTIONS`
                : mode === 'Learning path'
                  ? `${lessons.length} LESSONS`
                  : mode === 'Scenario workshop' ? `${scenarios.length} CASE FILES` : mode === 'Code drills' ? `${challenges.length} DRILLS` : mode === 'Code lab' ? `${chapter.questions.length} EXERCISES` : `CHAPTER ${String(index + 1).padStart(2, '0')}`}
            </span>
          </div>}
          {mode !== 'Home' && <div className="stats">
            <div>
              <strong>{allQuestions}</strong>
              <span>explained answers</span>
            </div>
            <div>
              <strong>{chapters.length}</strong>
              <span>focused chapters</span>
            </div>
            <div>
              <strong>{chapters.reduce((n, c) => n + c.quiz.length, 0) + scenarios.reduce((n, item) => n + item.quiz.length, 0) + challenges.length}</strong>
              <span>quiz questions</span>
            </div>
            <div>
              <strong>{completed}</strong>
              <span>checkpoints passed</span>
            </div>
          </div>}
          {mode !== 'Home' && (storageError || saved === '__unavailable__') && (
            <output className="notice">
              Browser storage is unavailable. Progress will last for this
              session only.
            </output>
          )}
          {mode === 'Home' ? (
            <LandingPage chapters={chapters} lessons={lessons} completed={completed} checkpoints={checkpoints.length} />
          ) : mode === 'Question index' ? (
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
              <p className="helper">The index covers {questionChapters.reduce((n, c) => n + c.questions.length, 0)} core questions. The full {total}-answer guide also includes the Common Issues playbook and Code Lab; use their dedicated indexes in the sidebar to search those banks.</p>
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
                {questionChapters.filter(matches).map((c) => (
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
              {!questionChapters.some(matches) && (
                <p className="notice">
                  No matches. Try a command name, a broader topic, or all
                  levels.
                </p>
              )}
            </>
          ) : mode === 'Scenario workshop' ? (
            <CaseWorkshop key={hash} scenarios={scenarios} selectedId={hash.split('/')[1]} progress={progress}
              checkpoint={(item) => <Quiz key={item.id} chapter={item} onGrade={(score) => save(score, item.id)} passed={progress[item.id] === item.quiz.length} />} />
          ) : mode === 'Code drills' ? (
            <article className="case-workshop"><a className="lab-back" href="#coding-exercises">← Open the draft editor and exercises</a><PracticeNotice />
              <Quiz key="code-drills" chapter={drillChapter} onGrade={(score) => save(score, drillChapter.id)} passed={progress[drillChapter.id] === drillChapter.quiz.length} />
            </article>
          ) : mode === 'SQL & files' ? (
            <ReferenceHub data={referenceData} tab={hash.split('/')[1]} />
          ) : mode === 'Learning path' ? (
            <><a className="workshop-link" href="#scenarios"><Terminal size={18} /> Apply your learning: open the scenario workshop →</a><LearningPath lessons={lessons} chapters={chapters} activeId={activeLesson}
              progress={progress} onGrade={(score) => save(score, `lesson-${activeLesson}`)} /></>
          ) : (
            <div className={`reading-layout ${mode === 'Code lab' || mode === 'Common issues' ? 'coding-layout' : ''}`}>
              <article key={chapter.id}>
                <div className="section-head">
                  <h2>{mode === 'Code lab' ? 'Code Lab exercise index' : 'Questions and explanations'}</h2>
                  <span>
                    {chapter.questions.length} {mode === 'Code lab' ? 'EXERCISES' : 'QUESTIONS'} · EASY → HARD
                  </span>
                </div>
                <p className="helper">
                  {mode === 'Code lab' ? 'Choose an exercise from the matching index, write your approach, then compare the examples and review the test cases.' : 'Try answering aloud, then expand to check your reasoning.'}
                </p>
                {mode === 'Common issues' && <><PracticeNotice /><div className="filters issue-sections" aria-label="Common issue topics"><a className={!issueSection ? 'chosen' : ''} href="#common-issues">All issues</a>{issueSections.map((item) => <a key={item.id} className={issueSection?.id === item.id ? 'chosen' : ''} href={`#common-issues/${item.id}`}>{item.category}</a>)}</div></>}
                {mode === 'Code lab' && <a className="workshop-link" href="#code-drills"><Terminal size={18} /> Try {challenges.length} code decision drills with evaluated answers →</a>}
                <QuestionBank key={chapter.id} chapter={chapter} lab={mode === 'Code lab'} exerciseId={exerciseId}
                  onExerciseCheck={markLabExercise} completed={labProgress} />
                <section className="sources">
                  <h2>IBM documentation & further reading</h2>
                  <p>
                    Original study explanations with official IBM
                    references. Feature
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
                  onGrade={(score) => save(score, chapter.id)}
                  passed={progress[chapter.id] === chapter.quiz.length}
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
                    progress[chapter.id] === chapter.quiz.length ? (
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
                      {progress[chapter.id] === chapter.quiz.length
                        ? 'Final chapter passed. Revisit any topic from the index.'
                        : 'Pass the final checkpoint to finish this chapter.'}
                    </p>
                  )}
                </div>
              </article>
              {mode !== 'Code lab' && mode !== 'Common issues' && <aside className="study-rail">
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
              </aside>}
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
        scenarios={data.scenarios as Scenario[]} challenges={data.challenges as Challenge[]} issueSections={data.issueSections} referenceData={data.referenceData as ReferenceData}
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
  chapters: chapterList, activeId, progress, onGrade,
}: {
  lessons: Lesson[]; chapters: Chapter[]; activeId: string;
  progress: Record<string, number>; onGrade: (score: number) => void;
}) {
  const setActiveId = (lessonId: string) => { window.location.hash = `learn/${lessonId}`; };
  const lesson = lessonList.find((item) => item.id === activeId) || lessonList[0];
  if (!lesson) return null;
  const related = lesson.chapterIds
    .map((chapterId) => chapterList.find((chapter) => chapter.id === chapterId))
    .filter((chapter): chapter is Chapter => Boolean(chapter));
  const checkpointQuiz = lessonQuiz(lesson, chapterList);
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
            onGrade={onGrade}
            passed={progress[checkpoint.id] === checkpoint.quiz.length}
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
              disabled={progress[checkpoint.id] !== checkpoint.quiz.length}
              onClick={() => setActiveId(next.id)}
              title={progress[checkpoint.id] !== checkpoint.quiz.length ? 'Pass this lesson checkpoint first' : undefined}
            >
              Continue: {next.title} <ArrowRight size={16} />
            </button>
          ) : (
            <p>{progress[checkpoint.id] === checkpoint.quiz.length ? 'Learning path complete. Use the question index for deeper practice.' : 'Pass this checkpoint to finish the path.'}</p>
          )}
        </div>
      </article>
    </div>
  );
}
function CodeWorkspace({ question, onCheck }: { question: Question; onCheck?: (questionId: string) => void }) {
  const language = question.fixedFormat ? 'RPGLE' : 'CLLE';
  const [format, setFormat] = useState(language === 'RPGLE' ? 'free' : 'cl');
  const draftKey = `learn-as400-draft-${question.id}`;
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    try {
      const value = JSON.parse(localStorage.getItem(draftKey) || '{}');
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      return Object.fromEntries(Object.entries(value).filter(([name, text]) =>
        ['free', 'fixed', 'cl'].includes(name) && typeof text === 'string' && text.length <= 100000)) as Record<string, string>;
    } catch { return {}; }
  });
  const [status, setStatus] = useState('Drafts stay in this browser.');
  const [check, setCheck] = useState<{ ok: boolean; notes: string[] } | null>(null);
  const starter = format === 'free' ? '**FREE\n// Write your solution here. Add the declarations and fixtures\n// described in the exercise requirements.\n'
    : format === 'fixed' ? '      * Write your fixed-format solution here.\n      * Keep specification and factor columns aligned.\n'
      : 'PGM\n/* Add declarations, your logic, and error handling. */\nENDPGM\n';
  const code = drafts[format] ?? starter;
  const update = (value: string) => {
    const next = { ...drafts, [format]: value };
    setDrafts(next);
    setCheck(null);
    try {
      localStorage.setItem(draftKey, JSON.stringify(next));
      setStatus('Draft saved in this browser.');
    } catch { setStatus('Storage unavailable. Download your draft to keep it.'); }
  };
  const checkStructure = () => {
    const result = reviewDraft(code, format);
    setCheck(result);
    if (result.ok) onCheck?.(question.id);
    setStatus(result.ok ? 'Basic source review recorded. Compilation and tests still required.' : 'Review the source notes below.');
  };
  return (
    <section className="code-workspace" aria-label="Your code workspace">
      <div className="workspace-heading"><h3>Your workspace</h3><span className="small">{language} · draft editor</span></div>
      {language === 'RPGLE' && <div className="filters" aria-label="Source format">
        {[['free', 'Fully free'], ['fixed', 'Fixed format']].map(([value, label]) =>
          <button key={value} aria-pressed={format === value} className={format === value ? 'chosen' : ''} onClick={() => { setFormat(value); setCheck(null); }}>{label}</button>)}
      </div>}
      <label className="sr-only" htmlFor={`draft-${question.id}`}>Your {format} solution for {question.topic}</label>
      {format === 'fixed' && <div className="column-guide"><strong>Fixed-format column guide</strong><pre aria-label="Columns 1 to 80">{'         1         2         3         4         5         6         7         8\n12345678901234567890123456789012345678901234567890123456789012345678901234567890'}</pre><small>Specification type in column 6; comment marker in column 7. Field positions depend on the specification.</small></div>}
      <textarea id={`draft-${question.id}`} value={code} onChange={(event) => update(event.target.value)}
        spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off" maxLength={100000}
        data-clarity-mask="true" aria-describedby={`editor-note-${question.id}`} />
      <div className="workspace-actions">
        <button className="secondary" onClick={checkStructure}>Review source basics</button>
        <button className="secondary" onClick={() => {
          const url = URL.createObjectURL(new Blob([code], { type: 'text/plain;charset=utf-8' }));
          const link = document.createElement('a');
          link.href = url; link.download = `${question.id}-${format}.${language.toLowerCase()}`;
          link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}>Download source</button>
        <output className="small">{status}</output>
      </div>
      {check && <output className={`workspace-check ${check.ok ? 'ok' : 'needs-work'}`}>
        <strong>{check.ok ? 'Draft review only — not compiled' : 'A few things to review'}</strong>
        <ul>{check.notes.map((note) => <li key={note}>{note}</li>)}</ul>
      </output>}
      <p className="small" id={`editor-note-${question.id}`}>Write and compare your solution here. This editor does not compile or run RPGLE or CL. Run the test cases on an IBM i development system with the required files and declarations.</p>
    </section>
  );
}
function QuestionAnswer({ question: q }: { question: Question }) {
  return <>
    {q.diagnosticSteps && <ol className="diagnostic-steps">{q.diagnosticSteps.map((step) => <li key={step.title}><h3>{step.title}</h3><p><RichText text={step.detail} /></p>{step.command && <pre><code>{step.command}</code></pre>}</li>)}</ol>}
    {q.verification && <section className="verification-box"><strong>Verify the result</strong><p><RichText text={q.verification} /></p></section>}
    {q.answer.map((answer, index) => <p key={index}><RichText text={answer} /></p>)}
    {q.example && <><strong className="code-label">{q.exampleLabel || 'Example'}</strong><pre><code>{q.example}</code></pre></>}
    {(q.fixedFormat || q.freeFormat) && <div className="code-pairs">
      {q.fixedFormat && <div><strong>{q.fixedLabel || 'Fixed-format RPG'}</strong><pre><code>{q.fixedFormat}</code></pre></div>}
      {q.freeFormat && <div><strong>{q.freeLabel || 'Fully free RPG'}</strong><pre><code>{q.freeFormat}</code></pre></div>}
    </div>}
    {q.trap && <div className="trap"><strong>Common pitfall</strong><p><RichText text={q.trap} /></p></div>}
  </>;
}
function QuestionCard({ question: q, index, lab, selected, onExerciseCheck, completed }: {
  question: Question; index: number; lab: boolean; selected: boolean;
  onExerciseCheck?: (questionId: string) => void; completed?: boolean;
}) {
  const [open, setOpen] = useState(selected);
  return <details className="question" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary>
      <span className="q-number">{String(index + 1).padStart(2, '0')}</span>
      <span className="q-title">{q.question}<span className={`badge ${q.level.toLowerCase()}`}>{q.level}</span>
        {q.topic && <span className="question-topic">{q.topic}</span>}</span>
      <span className="expand">+</span>
    </summary>
    {open && <div className="answer">
      {q.requirements && <section className="exercise-brief"><h3>Your task &amp; setup</h3><ul>{q.requirements.map((item) => <li key={item}><RichText text={item} /></li>)}</ul></section>}
      {q.hints && <details className="exercise-hints"><summary>Need a hint?</summary><ul>{q.hints.map((hint) => <li key={hint}><RichText text={hint} /></li>)}</ul></details>}
      {lab && <><PracticeNotice /><CodeWorkspace question={q} onCheck={onExerciseCheck} /></>}
      {q.testCases && <section className="exercise-tests"><h3>Test cases to work through</h3>
        <p className="small">Check the normal case, boundary conditions, and failure paths. Expected results below are a review guide; they have not been executed by this website.</p>
        <ol>{q.testCases.map((item) => <li key={item}><RichText text={item} /></li>)}</ol>
      </section>}
      {lab && q.testCases && <TestNotebook id={q.id} cases={q.testCases} />}
      {lab ? <details className="exercise-solution"><summary>Compare approach &amp; reference code</summary><QuestionAnswer question={q} /></details> : <QuestionAnswer question={q} />}
      {q.sources && <div className="exercise-references"><strong>IBM documentation for this topic</strong>{q.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div>}
      {lab && completed && <output className="exercise-done"><Check size={14} /> A draft review was recorded. This is not a compile or test pass.</output>}
    </div>}
  </details>;
}
function QuestionBank({ chapter, lab, exerciseId, onExerciseCheck, completed }: {
  chapter: Chapter; lab: boolean; exerciseId?: string;
  onExerciseCheck?: (questionId: string) => void; completed: Record<string, boolean>;
}) {
  const [language, setLanguage] = useState('All languages');
  const [level, setLevel] = useState('All levels');
  const [search, setSearch] = useState('');
  const selected = chapter.questions.some((question) => question.id === exerciseId) ? exerciseId : undefined;
  const questions = chapter.questions.filter((question) => !lab || (selected ? question.id === selected
    : (language === 'All languages' || (question.fixedFormat ? 'RPGLE' : 'CLLE') === language)
      && (level === 'All levels' || question.level === level)
      && `${question.topic} ${question.question} ${question.requirements?.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase())));
  return <>
    {lab && (selected ? <a className="lab-back" href="#coding-exercises">← All coding exercises</a> : <div className="lab-filters">
      <div className="searchbox"><Search size={18} /><input aria-label="Search coding exercises" placeholder="Find a scenario: locks, batch, SQL, files…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <div className="filters" aria-label="Exercise language">{['All languages', 'RPGLE', 'CLLE'].map((item) => <button key={item} aria-pressed={language === item} className={language === item ? 'chosen' : ''} onClick={() => setLanguage(item)}>{item}</button>)}</div>
      <div className="filters" aria-label="Exercise difficulty">{['All levels', 'Easy', 'Intermediate', 'Advanced'].map((item) => <button key={item} aria-pressed={level === item} className={level === item ? 'chosen' : ''} onClick={() => setLevel(item)}>{item}</button>)}</div>
      <output className="small">{questions.length} of {chapter.questions.length} exercises</output>
    </div>)}
    <div className="questions">{questions.map((question) => <QuestionCard key={`${question.id}-${selected || 'all'}`} question={question} lab={lab} selected={question.id === selected}
      completed={completed[question.id]} onExerciseCheck={onExerciseCheck} index={chapter.questions.indexOf(question)} />)}</div>
    {questions.length === 0 && <p className="notice">No exercises match. Try another topic or choose all levels and languages.</p>}
  </>;
}
function Quiz({
  chapter,
  onGrade,
  passed,
}: {
  chapter: { id: string; title: string; quiz: PracticeQuestion[] };
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
        retry as needed.{passed ? ' You have already passed this checkpoint.' : ''}
      </p>
      {chapter.quiz.map((q, i) => (
        <fieldset className="quiz-question" key={`${i}-${attempt}`}>
          <legend>
            <span>{i + 1}.</span> {q.question}
          </legend>
          {q.code && <pre className="drill-code"><code>{q.code}</code></pre>}
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
          {result !== null && q.tests && <details className="drill-tests"><summary>Walk through the test cases</summary>{q.tests.map((test) => <div key={test.input}><strong>Given: {test.input}</strong><p>Expected: {test.expected}</p><p>{test.why}</p></div>)}</details>}
          {q.sources && <References sources={q.sources} />}
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
