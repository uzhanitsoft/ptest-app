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

      {/* Header */}
      <header className="header">
        <div className="max-w-2xl mx-auto px-4">
          {/* Top row */}
          <div className="flex items-center justify-between h-12">
            <span className="text-sm font-semibold tracking-tight text-zinc-200">
              PTest
            </span>
            {hasData && (
              <div className="flex items-center gap-1">
                <button onClick={exportAll}
                  className="btn btn-ghost !px-2.5 !py-1.5 !text-xs !rounded-lg !border-0">
                  <Download size={14} />
                </button>
                <button onClick={resetAll}
                  className="btn btn-ghost !px-2.5 !py-1.5 !text-xs !rounded-lg !border-0 hover:!text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-5">
            <button onClick={() => setActiveTab('main')}
              className={`tab ${activeTab === 'main' ? 'active' : ''}`}>
              <span className="flex items-center gap-1.5">
                <ClipboardList size={14} />
                Основной
                {mc > 0 && <span className="text-[10px] text-zinc-500 font-normal">{mc}</span>}
              </span>
            </button>
            <button onClick={() => setActiveTab('exceptions')}
              className={`tab ${activeTab === 'exceptions' ? 'active' : ''}`}>
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Исключения
                {ec > 0 && <span className="text-[10px] text-amber-500/70 font-normal">{ec}</span>}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
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
