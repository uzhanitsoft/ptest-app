import { useState, useRef, useCallback } from 'react';
import { Upload, FileJson } from 'lucide-react';

export default function FileUploader({ onUpload, label }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const processFile = useCallback((file) => {
    if (!file?.name.endsWith('.json')) {
      setError('Только JSON файлы');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data) || !data[0]?.savol) {
          setError('Неверный формат');
          return;
        }
        onUpload(data);
      } catch { setError('Ошибка парсинга'); }
    };
    reader.readAsText(file);
  }, [onUpload]);

  return (
    <div className="animate-fade-up">
      <div
        className={`drop-zone flex flex-col items-center justify-center py-20 sm:py-28 ${isDragging ? 'active' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        <input ref={inputRef} type="file" accept=".json" className="hidden"
          onChange={(e) => processFile(e.target.files[0])} />

        <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4">
          <Upload size={20} className="text-zinc-400" />
        </div>

        <p className="text-sm font-medium text-zinc-300 mb-1">
          Загрузить {label}
        </p>
        <p className="text-xs text-zinc-600">
          JSON файл · перетащите или нажмите
        </p>

        {error && (
          <p className="mt-4 text-xs text-red-400 animate-fade">{error}</p>
        )}
      </div>
    </div>
  );
}
