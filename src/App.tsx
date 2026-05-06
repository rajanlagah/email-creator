import { useCallback } from 'react';
import type { EmailData } from './types';
import { generateHtml } from './generateHtml';
import { useLocalStorage } from './hooks/useLocalStorage';
import LeftPanel from './components/LeftPanel';
import PreviewPanel from './components/PreviewPanel';
import './App.css';

function defaultMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const DEFAULT_DATA: EmailData = {
  monthYear: defaultMonthYear(),
  preheader: '',
  heroHeadline: '',
  heroSubtext: '',
  featureCards: [],
  fiItems: [],
  ctaHeadline: '',
};

export default function App() {
  const [data, setData] = useLocalStorage<EmailData>('email-template-data', DEFAULT_DATA);

  const html = generateHtml(data);

  const handleDownload = useCallback(() => {
    const date = new Date(`${data.monthYear}-01`);
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      .toLowerCase()
      .replace(' ', '-');
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doubletick-${label}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [html, data.monthYear]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="topbar-dot" />
          DoubleTick Email Generator
        </div>
        <button className="btn-export" onClick={handleDownload}>
          Download HTML
        </button>
      </header>

      <div className="workspace">
        <LeftPanel data={data} onChange={setData} />
        <PreviewPanel html={html} />
      </div>
    </div>
  );
}
