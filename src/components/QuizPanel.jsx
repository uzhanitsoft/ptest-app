import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRightLeft, RotateCcw, Check, X, Play } from 'lucide-react';

const SESSION_KEY = 'ptest_session';

function loadSession(tabType) {
  try {
    const all = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    return all[tabType] || null;
  } catch { return null; }
}

function saveSession(tabType, data) {
  try {
    const all = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    all[tabType] = data;
    localStorage.setItem(SESSION_KEY, JSON.stringify(all));
  } catch {}
}

function clearSession(tabType) {
  try {
    const all = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    delete all[tabType];
    localStorage.setItem(SESSION_KEY, JSON.stringify(all));
  } catch {}
}

export default function QuizPanel({ tests, onTransfer, transferLabel, transferType, tabName, tabType }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [dir, setDir] = useState('right');
  const [key, setKey] = useState(0);
  const [stats, setStats] = useState({ ok: 0, fail: 0 });
  const [showResume, setShowResume] = useState(false);
  const [savedSession, setSavedSession] = useState(null);

  // Check for saved session on mount
  useEffect(() => {
    const session = loadSession(tabType);
    if (session && session.idx > 0 && session.total === tests.length) {
      setSavedSession(session);
      setShowResume(true);
    }
  }, [tabType, tests.length]);

  // Save session on every progress change
  useEffect(() => {
    if (!showResume && idx > 0) {
      saveSession(tabType, {
        idx,
        stats,
        total: tests.length,
        questionId: tests[idx]?.id,
        timestamp: Date.now()
      });
    }
  }, [idx, stats, tabType, tests, showResume]);

  const q = tests[idx];
  const total = tests.length;
  const pct = total > 0 ? ((idx + 1) / total) * 100 : 0;

  const answers = useMemo(() => {
    if (!q) return [];
    return [q.javob_1, q.javob_2, q.javob_3, q.javob_4]
      .map((text, i) => ({ key: i + 1, text }))
      .filter(a => a.text);
  }, [q]);

  const isRight = useCallback((k) => k === q?.togri_javob_raqami, [q]);

  const go = useCallback((n, d) => {
    if (n < 0 || n >= total) return;
    setDir(d);
    setKey(k => k + 1);
    setIdx(n);
    setSelected(null);
  }, [total]);

  const next = useCallback(() => go(idx + 1, 'right'), [idx, go]);
  const prev = useCallback(() => go(idx - 1, 'left'), [idx, go]);

  // Auto-advance
  useEffect(() => {
    if (selected === null) return;
    const correct = isRight(selected);
    const auto = tabType === 'main' ? !correct : correct;
    if (auto && idx < total - 1) {
      const t = setTimeout(next, 600);
      return () => clearTimeout(t);
    }
  }, [selected, tabType, isRight, idx, total, next]);

  const pick = (k) => {
    if (selected !== null) return;
    setSelected(k);
    setStats(s => isRight(k) ? { ...s, ok: s.ok + 1 } : { ...s, fail: s.fail + 1 });
  };

  const transfer = () => {
    onTransfer(q);
    if (idx >= tests.length - 1 && idx > 0) setIdx(idx - 1);
    setSelected(null);
    setKey(k => k + 1);
  };

  const restart = () => {
    setIdx(0);
    setSelected(null);
    setStats({ ok: 0, fail: 0 });
    setKey(k => k + 1);
    clearSession(tabType);
    setShowResume(false);
  };

  const handleResume = () => {
    if (savedSession) {
      setIdx(savedSession.idx);
      setStats(savedSession.stats || { ok: 0, fail: 0 });
      setKey(k => k + 1);
    }
    setShowResume(false);
  };

  const handleStartFresh = () => {
    setIdx(0);
    setStats({ ok: 0, fail: 0 });
    clearSession(tabType);
    setShowResume(false);
  };

  if (!tests?.length) {
    return (
      <div className="surface p-12 text-center animate-fade-up">
        <p className="text-sm text-zinc-500">Нет вопросов</p>
      </div>
    );
  }

  // Resume screen
  if (showResume && savedSession) {
    const resumePct = ((savedSession.idx + 1) / savedSession.total * 100).toFixed(0);
    const timeAgo = getTimeAgo(savedSession.timestamp);

    return (
      <div className="animate-fade-up space-y-4">
        <div className="surface p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
            <Play size={24} className="text-violet-400 ml-0.5" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-zinc-100 mb-1">
              Продолжить тестирование?
            </h3>
            <p className="text-xs text-zinc-500">
              {tabName} · {timeAgo}
            </p>
          </div>

          {/* Session info */}
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              Вопрос {savedSession.idx + 1} из {savedSession.total}
            </span>
            <span>{resumePct}%</span>
          </div>

          {/* Mini progress */}
          <div className="progress-track mx-auto max-w-xs">
            <div className="progress-fill" style={{ width: `${resumePct}%` }} />
          </div>

          {/* Stats */}
          {(savedSession.stats?.ok > 0 || savedSession.stats?.fail > 0) && (
            <div className="flex items-center justify-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-emerald-500">
                <Check size={12} strokeWidth={2.5} /> {savedSession.stats.ok}
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <X size={12} strokeWidth={2.5} /> {savedSession.stats.fail}
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
            <button onClick={handleResume}
              className="btn btn-primary w-full !py-3 !text-sm">
              <Play size={15} />
              Продолжить
            </button>
            <button onClick={handleStartFresh}
              className="btn btn-ghost w-full !py-2.5 !text-xs">
              <RotateCcw size={13} />
              Начать сначала
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!q) { setIdx(0); return null; }

  const cls = (k) => {
    if (selected === null) return '';
    if (k === q.togri_javob_raqami) return 'correct';
    if (k === selected && !isRight(k)) return 'incorrect';
    return '';
  };

  return (
    <div className="space-y-3 pb-24 sm:pb-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="pill">{idx + 1} / {total}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-500">
            <Check size={12} strokeWidth={2.5} /> {stats.ok}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <X size={12} strokeWidth={2.5} /> {stats.fail}
          </span>
          <button onClick={restart} className="text-zinc-600 hover:text-zinc-400 transition-colors p-1">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Question card */}
      <div key={key}
        className={`surface p-4 sm:p-6 space-y-4 ${dir === 'right' ? 'animate-slide-right' : 'animate-slide-left'}`}>

        {/* Meta */}
        <p className="text-[11px] text-zinc-600 font-medium tracking-wide uppercase">
          Билет {q.bilet_id} · #{q.id}
        </p>

        {/* Question */}
        <h2 className="text-[15px] sm:text-base font-medium leading-relaxed text-zinc-100">
          {q.savol}
        </h2>

        {/* Image */}
        {q.rasm && q.rasm.length > 0 && (
          <div className="rounded-xl overflow-hidden bg-black border border-zinc-800/50">
            <img src={q.rasm} alt="" className="question-image"
              onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        )}

        {/* Answers */}
        <div className="space-y-2">
          {answers.map((a, i) => (
            <button key={a.key} onClick={() => pick(a.key)}
              disabled={selected !== null}
              className={`answer-btn ${cls(a.key)}`}>
              <div className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-semibold transition-all duration-200
                  ${cls(a.key) === 'correct' ? 'bg-emerald-500/20 text-emerald-400' :
                    cls(a.key) === 'incorrect' ? 'bg-red-500/20 text-red-400' :
                    'bg-zinc-800/60 text-zinc-500'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-[13px] sm:text-sm leading-snug text-zinc-300 pt-px">
                  {a.text}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Wrong answer feedback */}
        {selected !== null && !isRight(selected) && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 animate-fade">
            <Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-400/80 leading-relaxed">
              {q.togri_javob}
            </p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="bottom-bar">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-2">
          <button onClick={transfer}
            className={`btn text-xs !rounded-lg !py-2.5 !px-3 gap-1.5
              ${transferType === 'warning'
                ? 'bg-amber-500/8 text-amber-400/80 border border-amber-500/15 hover:bg-amber-500/15'
                : 'bg-emerald-500/8 text-emerald-400/80 border border-emerald-500/15 hover:bg-emerald-500/15'
              }`}>
            <ArrowRightLeft size={13} />
            <span className="hidden min-[360px]:inline">{transferLabel}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button onClick={prev} disabled={idx === 0}
              className="btn btn-ghost !p-2.5 !rounded-lg">
              <ChevronLeft size={16} />
            </button>
            <button onClick={next} disabled={idx >= total - 1}
              className="btn btn-primary !py-2.5 !px-4 !rounded-lg !text-xs">
              Далее
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}
