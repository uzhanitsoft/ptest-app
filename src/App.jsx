import { useState, useEffect, useCallback } from 'react';
import { Download, Trash2, ClipboardList, AlertTriangle } from 'lucide-react';
import QuizPanel from './components/QuizPanel';
import FileUploader from './components/FileUploader';

const STORAGE_KEY = 'ptest_v2';

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [activeTab, setActiveTab] = useState('main');
  const [mainTests, setMainTests] = useState(null);
  const [exceptionTests, setExceptionTests] = useState(null);
  const [toast, setToast] = useState(null);

  // Telegram Mini App — full screen
  useEffect(() => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg) return;

      tg.ready();
      tg.expand();
      try { tg.setHeaderColor('#09090b'); } catch {}
      try { tg.setBackgroundColor('#09090b'); } catch {}
      try { tg.disableVerticalSwipes(); } catch {}

      // requestFullscreen requires user gesture — trigger on first tap
      const goFullscreen = () => {
        try {
          if (tg.requestFullscreen) tg.requestFullscreen();
        } catch {}
        document.removeEventListener('click', goFullscreen);
        document.removeEventListener('touchstart', goFullscreen);
      };
      document.addEventListener('click', goFullscreen, { once: true });
      document.addEventListener('touchstart', goFullscreen, { once: true });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        if (saved.m) setMainTests(saved.m);
        if (saved.e) setExceptionTests(saved.e);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (mainTests !== null || exceptionTests !== null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ m: mainTests, e: exceptionTests }));
    }
  }, [mainTests, exceptionTests]);

  const showToast = (text, type = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2000);
  };

  const moveToExceptions = useCallback((q) => {
    setMainTests(prev => prev.filter(x => x.id !== q.id));
    setExceptionTests(prev => prev ? [...prev, q] : [q]);
    showToast(`#${q.id} → Исключения`);
  }, []);

  const moveToMain = useCallback((q) => {
    setExceptionTests(prev => prev.filter(x => x.id !== q.id));
    setMainTests(prev => prev ? [...prev, q] : [q]);
    showToast(`#${q.id} → Основной`);
  }, []);

  const exportAll = () => {
    if (mainTests) downloadJSON(mainTests, 'ptest_main.json');
    setTimeout(() => {
      if (exceptionTests) downloadJSON(exceptionTests, 'ptest_exceptions.json');
    }, 500);
    showToast('Файлы скачаны');
  };

  const resetAll = () => {
    if (confirm('Удалить все данные?')) {
      setMainTests(null);
      setExceptionTests(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const mc = mainTests?.length || 0;
  const ec = exceptionTests?.length || 0;
  const hasData = mainTests || exceptionTests;

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Toast */}
      {toast && (
        <div className="toast">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          {toast.text}
        </div>
      )}

      {/* Header — offset for TG close button */}
      <header className="header" style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}>
        <div className="max-w-2xl mx-auto px-4">
          {/* Tabs — centered, large touch targets */}
          <div className="flex items-center justify-center gap-2 pt-2 pb-1">
            <button onClick={() => setActiveTab('main')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${activeTab === 'main'
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                  : 'text-zinc-500 border border-transparent hover:text-zinc-300'}`}>
              <ClipboardList size={15} />
              Основной
              {mc > 0 && <span className="text-[10px] opacity-60">{mc}</span>}
            </button>
            <button onClick={() => setActiveTab('exceptions')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${activeTab === 'exceptions'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  : 'text-zinc-500 border border-transparent hover:text-zinc-300'}`}>
              <AlertTriangle size={15} />
              Исключения
              {ec > 0 && <span className="text-[10px] opacity-60">{ec}</span>}
            </button>
          </div>

          {/* Actions row — below tabs, always visible */}
          {hasData && (
            <div className="flex items-center justify-center gap-2 pb-2 pt-1">
              <button onClick={exportAll}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 hover:text-zinc-200 active:scale-95 transition-all">
                <Download size={13} />
                Скачать
              </button>
              <button onClick={resetAll}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 hover:text-red-400 active:scale-95 transition-all">
                <Trash2 size={13} />
                Очистить
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-3 sm:py-6">
        <div className="animate-fade-up">
          {activeTab === 'main' ? (
            mainTests ? (
              <QuizPanel
                key="main"
                tests={mainTests}
                onTransfer={moveToExceptions}
                transferLabel="В исключения"
                transferType="warning"
                tabName="Основной"
                tabType="main"
              />
            ) : (
              <FileUploader onUpload={setMainTests} label="основной" />
            )
          ) : (
            exceptionTests ? (
              <QuizPanel
                key="exceptions"
                tests={exceptionTests}
                onTransfer={moveToMain}
                transferLabel="В основной"
                transferType="success"
                tabName="Исключения"
                tabType="exceptions"
              />
            ) : (
              <FileUploader onUpload={setExceptionTests} label="исключения" />
            )
          )}
        </div>
      </main>
    </div>
  );
}
