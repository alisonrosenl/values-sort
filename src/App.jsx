import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
} from '@dnd-kit/core';
import values from './data/values';
import './App.css';

// --- Constants ---

const LOGO_URL = 'https://images.squarespace-cdn.com/content/68138d98b173884d75ec5456/3eb007bc-2889-4fea-9e9c-6f6f1bcb2b29/NameOnlyScript.png?content-type=image%2Fpng';
const MONOGRAM_URL = 'https://images.squarespace-cdn.com/content/68138d98b173884d75ec5456/24c580c0-22ac-4dc2-a41c-5d97c4f50b42/Monogram.png?content-type=image%2Fpng';

const STORAGE_KEY = 'values-sort-progress';
const HISTORY_KEY = 'values-sort-history';
const TOP5_LIMIT = 5;

const VALUE_CONFLICTS = [
  ['ACHIEVEMENT', 'INNER PEACE'],
  ['AUTHORITY', 'HUMILITY'],
  ['AUTONOMY', 'COOPERATION'],
  ['ADVENTURE', 'SAFETY'],
  ['COMFORT', 'CHALLENGE'],
  ['SOLITUDE', 'POPULARITY'],
  ['WEALTH', 'GENEROSITY'],
  ['RATIONALITY', 'PASSION'],
  ['ORDER', 'CHANGE'],
  ['MODERATION', 'ADVENTURE'],
  ['COMMITMENT', 'AUTONOMY'],
  ['ROMANCE', 'SOLITUDE'],
];

// --- Utilities ---

function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function saveToHistory(result) {
  try {
    const existing = loadHistory();
    existing.push(result);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing));
  } catch {}
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function encodeResults(piles) {
  const compact = {
    v: piles.veryImportant.map((v) => v.id),
    i: piles.important.map((v) => v.id),
    n: piles.notImportant.map((v) => v.id),
  };
  return btoa(JSON.stringify(compact));
}

function decodeResults(encoded) {
  try {
    const compact = JSON.parse(atob(encoded));
    const findValue = (id) => values.find((v) => v.id === id);
    return {
      veryImportant: (compact.v || []).map(findValue).filter(Boolean),
      important: (compact.i || []).map(findValue).filter(Boolean),
      notImportant: (compact.n || []).map(findValue).filter(Boolean),
    };
  } catch {
    return null;
  }
}

// --- Draggable Card ---

function DraggableCard({ card }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'current-card',
    data: card,
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 100,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`value-card card-enter ${isDragging ? 'dragging' : ''}`}
    >
      <h2>{card.title}</h2>
      <p>{card.description}</p>
    </div>
  );
}

// --- Droppable Pile ---

function DroppablePile({ id, label, cards, className }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const count = cards.length;
  const topCard = cards[cards.length - 1];

  return (
    <div
      ref={setNodeRef}
      className={`pile ${className} ${isOver ? 'pile-over' : ''} ${count > 0 ? 'pile-has-cards' : ''}`}
    >
      <h3>{label}</h3>
      <span className="pile-count">
        {count} {count === 1 ? 'card' : 'cards'}
      </span>
      {count > 0 && (
        <div className="pile-stack">
          {count > 2 && <div className="pile-stack-card pile-stack-card-3" />}
          {count > 1 && <div className="pile-stack-card pile-stack-card-2" />}
          <div className="pile-stack-card pile-stack-card-1">
            <div className="pile-stack-title">{topCard.title}</div>
            <div className="pile-stack-desc">{topCard.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Site Footer ---

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <a href="https://alisonrose.nl" target="_blank" rel="noopener noreferrer" className="footer-logo-link">
          <img src={MONOGRAM_URL} alt="Alison Rose" className="footer-logo" />
        </a>
      </div>
      <div className="footer-disclaimer">
        This tool is for personal reflection and self-discovery only.
        It is not a substitute for professional psychological, medical, or therapeutic advice.
        If you are experiencing a mental health concern, please consult a qualified professional.
      </div>
      <div className="footer-links">
        <a href="https://alisonrose.nl" target="_blank" rel="noopener noreferrer">alisonrose.nl</a>
        <span className="footer-sep">&middot;</span>
        <span className="footer-credit">
          Adapted from the Personal Values Card Sort by
          W.R. Miller, J. C&rsquo;de Baca, D.B. Matthews, P.L. Wilbourne
          &mdash; University of New Mexico, 2001
        </span>
      </div>
    </footer>
  );
}

// --- Screens ---

function IntroScreen({ email, setEmail, emailConsent, setEmailConsent, onStart, savedProgress, onResume, friendName }) {
  return (
    <div className="intro">
      <a href="https://alisonrose.nl" target="_blank" rel="noopener noreferrer" className="intro-brand-link">
        <img src={LOGO_URL} alt="Alison Rose" className="intro-logo" />
      </a>
      <p className="brand-presents">presents</p>
      <h1>Personal Values Card Sort</h1>
      <p className="subtitle">Discover what matters most to you</p>

      {friendName && (
        <div className="compare-banner">
          <strong>{friendName}</strong> invited you to compare values!
          Complete your sort to see how you match up.
        </div>
      )}
      <div className="instructions">
        <p>
          You will be shown <strong>49 value cards</strong> one at a time.
          For each card, sort it into one of three piles:
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          <strong>Very Important to Me</strong> &middot;{' '}
          <strong>Important to Me</strong> &middot;{' '}
          <strong>Not Important to Me</strong>
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          Drag each card to a pile, use the buttons, or press <strong>1</strong>, <strong>2</strong>, <strong>3</strong> on your keyboard.
          Go with your gut &mdash; there are no right or wrong answers.
        </p>
      </div>
      <div className="email-input-group">
        <label htmlFor="email">Your email (to receive your results)</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <label className="consent-checkbox">
        <input
          type="checkbox"
          checked={emailConsent}
          onChange={(e) => setEmailConsent(e.target.checked)}
        />
        <span>
          I agree to receive emails from Alison Rose. View{' '}
          <a href="https://www.alisonrose.nl/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          {' '}&amp;{' '}
          <a href="https://www.alisonrose.nl/terms-conditions" target="_blank" rel="noopener noreferrer">Terms</a>.
        </span>
      </label>
      <div className="intro-actions">
        <button
          className="btn btn-primary"
          onClick={onStart}
          disabled={!email || !email.includes('@') || !emailConsent}
        >
          Begin Sorting
        </button>
        {savedProgress && (
          <button
            className="btn btn-secondary"
            onClick={onResume}
          >
            Resume Previous Sort ({savedProgress.sortedCount} / {values.length} done)
          </button>
        )}
      </div>
    </div>
  );
}

function SortingScreen({ currentCard, totalCards, sortedCount, piles, onSort, onUndo, onFinishEarly, canUndo }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { over, delta } = event;
      if (over) {
        onSort(over.id);
        return;
      }
      // Swipe gesture fallback — if not dropped on a pile, use horizontal direction
      if (Math.abs(delta.x) > 60) {
        if (delta.x < -60) {
          onSort('notImportant');
        } else if (delta.x > 60) {
          onSort('veryImportant');
        }
      } else if (delta.y > 60) {
        onSort('important');
      }
    },
    [onSort]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case '1':
          onSort('notImportant');
          break;
        case '2':
          onSort('important');
          break;
        case '3':
          onSort('veryImportant');
          break;
        case 'z':
          if ((e.ctrlKey || e.metaKey) && canUndo) {
            e.preventDefault();
            onUndo();
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSort, onUndo, canUndo]);

  if (!currentCard) return null;

  return (
    <div className="sorting-screen">
      <img src={LOGO_URL} alt="Alison Rose" className="sorting-logo" />
      <h1 className="sorting-title">Personal Values Card Sort</h1>
      <div className="progress-bar-container">
        <div className="progress-label">
          <span>Card {sortedCount + 1} of {totalCards}</span>
          <span>{Math.round((sortedCount / totalCards) * 100)}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(sortedCount / totalCards) * 100}%` }}
          />
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="sorting-area">
          <div className="card-deck">
            <DraggableCard key={currentCard.id} card={currentCard} />
          </div>

          <div className="piles-container">
            <DroppablePile
              id="notImportant"
              label="Not Important to Me"
              cards={piles.notImportant}
              className="pile-not-important"
            />
            <DroppablePile
              id="important"
              label="Important to Me"
              cards={piles.important}
              className="pile-important"
            />
            <DroppablePile
              id="veryImportant"
              label="Very Important to Me"
              cards={piles.veryImportant}
              className="pile-very-important"
            />
          </div>

          <div className="quick-sort-buttons">
            <button
              className="btn btn-not-important"
              onClick={() => onSort('notImportant')}
            >
              Not Important <span className="key-hint">1</span>
            </button>
            <button
              className="btn btn-important"
              onClick={() => onSort('important')}
            >
              Important <span className="key-hint">2</span>
            </button>
            <button
              className="btn btn-very-important"
              onClick={() => onSort('veryImportant')}
            >
              Very Important <span className="key-hint">3</span>
            </button>
          </div>

          <div className="sort-actions">
            {canUndo && (
              <button className="btn btn-undo" onClick={onUndo}>
                Undo
              </button>
            )}
            {sortedCount > 0 && (
              <button className="btn btn-finish-early" onClick={onFinishEarly}>
                Finish Early
              </button>
            )}
          </div>

          <p className="sort-hint">
            Drag the card, tap a button, or press 1 / 2 / 3
          </p>
        </div>
      </DndContext>
    </div>
  );
}

function Top5Screen({ veryImportant, onConfirm }) {
  const [selected, setSelected] = useState(() =>
    veryImportant.slice(0, TOP5_LIMIT).map((v) => v.id)
  );

  const toggle = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= TOP5_LIMIT) return prev;
      return [...prev, id];
    });
  };

  return (
    <div className="top5-screen">
      <h1>Choose Your Top 5</h1>
      <p className="top5-subtitle">
        You marked <strong>{veryImportant.length}</strong> values as very important.
        Now narrow it down to the <strong>{TOP5_LIMIT}</strong> that matter most.
      </p>
      <p className="top5-count">
        {selected.length} of {TOP5_LIMIT} selected
      </p>
      <div className="top5-grid">
        {veryImportant.map((v) => (
          <button
            key={v.id}
            className={`top5-card ${selected.includes(v.id) ? 'top5-selected' : ''}`}
            onClick={() => toggle(v.id)}
          >
            <div className="top5-card-title">{v.title}</div>
            <div className="top5-card-desc">{v.description}</div>
          </button>
        ))}
      </div>
      <div className="top5-actions">
        <button
          className="btn btn-primary"
          onClick={() => onConfirm(selected)}
          disabled={selected.length !== TOP5_LIMIT}
        >
          Confirm My Top {TOP5_LIMIT}
        </button>
      </div>
    </div>
  );
}

function ResultsScreen({ piles, top5Ids, email, onStartOver, friendPiles, pastResults, setPastResults }) {
  const canvasRef = useRef(null);

  const top5Values = top5Ids.length > 0
    ? piles.veryImportant.filter((v) => top5Ids.includes(v.id))
    : [];

  // Detect value conflicts
  const conflicts = VALUE_CONFLICTS.filter(([a, b]) => {
    const topTitles = piles.veryImportant.map((v) => v.title);
    return topTitles.includes(a) && topTitles.includes(b);
  });

  const handleEmailResults = useCallback(() => {
    const buildList = (items) =>
      items.map((v) => `  - ${v.title}: ${v.description}`).join('\n');

    const top5Section = top5Values.length > 0
      ? [`\nMY TOP ${top5Values.length} VALUES:`, buildList(top5Values), '']
      : [];

    const body = [
      'PERSONAL VALUES CARD SORT RESULTS',
      '==================================\n',
      ...top5Section,
      `VERY IMPORTANT TO ME (${piles.veryImportant.length}):`,
      buildList(piles.veryImportant),
      `\nIMPORTANT TO ME (${piles.important.length}):`,
      buildList(piles.important),
      `\nNOT IMPORTANT TO ME (${piles.notImportant.length}):`,
      buildList(piles.notImportant),
      '\n---',
      'Based on the Personal Values Card Sort by',
      "W.R. Miller, J. C'de Baca, D.B. Matthews, P.L. Wilbourne",
      'University of New Mexico, 2001',
    ].join('\n');

    const subject = 'My Personal Values Card Sort Results';
    const mailtoLink = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  }, [piles, email, top5Values]);

  const handleShare = useCallback(() => {
    const encoded = encodeResults(piles);
    const name = email.split('@')[0];
    const url = `${window.location.origin}${window.location.pathname}?compare=${encoded}&from=${encodeURIComponent(name)}`;

    if (navigator.share) {
      navigator.share({
        title: 'Compare our values!',
        text: 'I just did a personal values card sort. Take it and compare your results with mine!',
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard! Share it with a friend.');
      }).catch(() => {
        prompt('Copy this link to share:', url);
      });
    }
  }, [piles, email]);

  const handleDownloadImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = 2;
    const w = 800;
    const h = 600;
    canvas.width = w * scale;
    canvas.height = h * scale;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#FFFDFC';
    ctx.fillRect(0, 0, w, h);

    // Top accent bar
    ctx.fillStyle = '#D6E1DD';
    ctx.fillRect(0, 0, w, 6);

    // Top 5 or Very Important
    const displayValues = top5Values.length > 0 ? top5Values : piles.veryImportant.slice(0, 10);

    // Branding — draw logo image first, then values
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Logo at top
      const logoH = 32;
      const logoW = logoImg.naturalWidth * (logoH / logoImg.naturalHeight);
      ctx.drawImage(logoImg, (w - logoW) / 2, 24, logoW, logoH);

      // Header
      ctx.fillStyle = '#507271';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`My Top ${displayValues.length} Values`, w / 2, 90);

      // Mustard divider
      ctx.strokeStyle = '#B6873F';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 3, 104);
      ctx.lineTo((2 * w) / 3, 104);
      ctx.stroke();

      // Value cards
      const startY = 125;
      displayValues.forEach((v, i) => {
        const y = startY + i * 48;
        // Card background
        ctx.fillStyle = '#D6E1DD';
        ctx.beginPath();
        ctx.roundRect(80, y, w - 160, 40, 6);
        ctx.fill();

        // Number
        ctx.fillStyle = '#507271';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}.`, 95, y + 26);

        // Title
        ctx.fillStyle = '#0E0D0C';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(v.title, 125, y + 26);

        // Description
        ctx.fillStyle = '#507271';
        ctx.font = 'italic 12px sans-serif';
        ctx.fillText(v.description, 125 + ctx.measureText(v.title).width + 12, y + 26);
      });

      // Footer
      ctx.fillStyle = '#B6873F';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('alisonrose.nl', w / 2, h - 20);

      // Download
      const link = document.createElement('a');
      link.download = 'MyValuesSortResults.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    logoImg.src = LOGO_URL;
  }, [piles, top5Values]);

  return (
    <div className="results-screen">
      <img src={LOGO_URL} alt="Alison Rose" className="results-logo" />
      <h1>Your Results</h1>
      <p className="results-subtitle">
        Here&rsquo;s how you sorted your personal values
      </p>

      {top5Values.length > 0 && (
        <div className="top5-results">
          <h2>Your Top {top5Values.length}</h2>
          <div className="top5-results-list">
            {top5Values.map((v, i) => (
              <div key={v.id} className="top5-result-item">
                <span className="top5-rank">{i + 1}</span>
                <div>
                  <div className="top5-result-title">{v.title}</div>
                  <div className="top5-result-desc">{v.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="conflicts-section">
          <h2>Value Tensions</h2>
          <p className="conflicts-intro">
            These values you rated highly can sometimes pull in different directions.
            Reflecting on how you balance them can deepen your self-understanding.
          </p>
          {conflicts.map(([a, b], i) => (
            <div key={i} className="conflict-pair">
              <span className="conflict-value">{a}</span>
              <span className="conflict-vs">&harr;</span>
              <span className="conflict-value">{b}</span>
            </div>
          ))}
        </div>
      )}

      {friendPiles && (
        <div className="comparison-section">
          <h2>How You Compare</h2>
          <div className="comparison-grid">
            <div className="comparison-col">
              <h3>Your Top Values</h3>
              {piles.veryImportant.map((v) => (
                <div key={v.id} className="comparison-item own">{v.title}</div>
              ))}
            </div>
            <div className="comparison-col">
              <h3>Their Top Values</h3>
              {friendPiles.veryImportant.map((v) => {
                const shared = piles.veryImportant.some((own) => own.id === v.id);
                return (
                  <div key={v.id} className={`comparison-item friend ${shared ? 'shared' : ''}`}>
                    {v.title} {shared && '★'}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="results-columns">
        <div className="results-column col-very-important">
          <h2>Very Important to Me</h2>
          <span className="column-count">
            {piles.veryImportant.length} values
          </span>
          {piles.veryImportant.map((v) => (
            <div key={v.id} className="result-card">
              <div className="result-title">{v.title}</div>
              <div className="result-desc">{v.description}</div>
            </div>
          ))}
        </div>

        <div className="results-column col-important">
          <h2>Important to Me</h2>
          <span className="column-count">
            {piles.important.length} values
          </span>
          {piles.important.map((v) => (
            <div key={v.id} className="result-card">
              <div className="result-title">{v.title}</div>
              <div className="result-desc">{v.description}</div>
            </div>
          ))}
        </div>

        <div className="results-column col-not-important">
          <h2>Not Important to Me</h2>
          <span className="column-count">
            {piles.notImportant.length} values
          </span>
          {piles.notImportant.map((v) => (
            <div key={v.id} className="result-card">
              <div className="result-title">{v.title}</div>
              <div className="result-desc">{v.description}</div>
            </div>
          ))}
        </div>
      </div>

      {pastResults.length > 1 && (
        <div className="history-section">
          <div className="history-header">
            <h2>Your Sort History</h2>
            <button
              className="clear-history-link"
              onClick={() => {
                try { localStorage.removeItem(HISTORY_KEY); } catch {}
                setPastResults([]);
              }}
            >
              Clear history
            </button>
          </div>
          <div className="history-list">
            {pastResults.slice().reverse().map((r, i) => (
              <div key={i} className="history-item">
                <span className="history-date">
                  {new Date(r.date).toLocaleDateString()}
                </span>
                <span className="history-summary">
                  {r.veryImportant.length} very important &middot;{' '}
                  {r.important.length} important &middot;{' '}
                  {r.notImportant.length} not important
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="results-actions">
        <button className="btn btn-primary" onClick={handleEmailResults}>
          Email My Results
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <button className="btn btn-primary" onClick={handleDownloadImage}>
          Download Image
        </button>
        <button className="btn btn-primary" onClick={handleShare}>
          Invite a Friend
        </button>
        <button className="btn btn-secondary" onClick={onStartOver}>
          Start Over
        </button>
      </div>

    </div>
  );
}

// --- Kit (email marketing) ---

const KIT_FORM_ID = '6d4949227';
const KIT_API_KEY = 'kit_78fe85509592cf5f7d88825770dc561e';

function subscribeToKit(email) {
  fetch(`https://api.convertkit.com/v3/forms/${KIT_FORM_ID}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: KIT_API_KEY, email }),
  }).catch(() => {});
}

// --- Main App ---

function App() {
  const [screen, setScreen] = useState('intro');
  const [email, setEmail] = useState('');
  const [emailConsent, setEmailConsent] = useState(false);
  const [cards, setCards] = useState([]);
  const [piles, setPiles] = useState({
    veryImportant: [],
    important: [],
    notImportant: [],
  });
  const [history, setHistory] = useState([]);
  const [top5Ids, setTop5Ids] = useState([]);
  const [friendPiles, setFriendPiles] = useState(null);
  const [friendName, setFriendName] = useState('');
  const [pastResults, setPastResults] = useState([]);
  const [savedProgress, setSavedProgress] = useState(null);

  const totalCards = values.length;
  const sortedCount = totalCards - cards.length;
  const currentCard = cards[0] || null;

  // Load saved data on mount
  useEffect(() => {
    const saved = loadProgress();
    if (saved) setSavedProgress(saved);

    setPastResults(loadHistory());

    // Check for friend comparison in URL
    const params = new URLSearchParams(window.location.search);
    const compareData = params.get('compare');
    const fromName = params.get('from');
    if (compareData) {
      const decoded = decodeResults(compareData);
      if (decoded) {
        setFriendPiles(decoded);
        if (fromName) setFriendName(decodeURIComponent(fromName));
      }
    }
  }, []);

  // Auto-save progress during sorting
  useEffect(() => {
    if (screen === 'sorting' && sortedCount > 0) {
      saveProgress({
        cards,
        piles,
        history,
        email,
        sortedCount,
      });
    }
  }, [screen, cards, piles, history, email, sortedCount]);

  const handleStart = useCallback(() => {
    if (email) {
      subscribeToKit(email);
    }
    setCards(shuffle(values));
    setPiles({ veryImportant: [], important: [], notImportant: [] });
    setHistory([]);
    setTop5Ids([]);
    setSavedProgress(null);
    clearProgress();
    setScreen('sorting');
  }, [email]);

  const handleResume = useCallback(() => {
    if (!savedProgress) return;
    setCards(savedProgress.cards);
    setPiles(savedProgress.piles);
    setHistory(savedProgress.history);
    if (savedProgress.email) setEmail(savedProgress.email);
    setSavedProgress(null);
    setScreen('sorting');
  }, [savedProgress]);

  const handleSort = useCallback(
    (pileId) => {
      if (!cards.length) return;
      const card = cards[0];
      setHistory((prev) => [...prev, { card, pileId }]);
      setPiles((prev) => ({
        ...prev,
        [pileId]: [...prev[pileId], card],
      }));
      const remaining = cards.slice(1);
      setCards(remaining);
      if (remaining.length === 0) {
        clearProgress();
        // Go to top5 if more than 5 very important, otherwise straight to results
        const newVeryImportant = [...piles.veryImportant, ...(pileId === 'veryImportant' ? [card] : [])];
        if (newVeryImportant.length > TOP5_LIMIT) {
          setScreen('top5');
        } else {
          const finalPiles = {
            ...piles,
            [pileId]: [...piles[pileId], card],
          };
          setTop5Ids(finalPiles.veryImportant.map((v) => v.id));
          saveResultToHistory(finalPiles);
          setScreen('results');
        }
      }
    },
    [cards, piles]
  );

  const saveResultToHistory = useCallback((finalPiles) => {
    const result = {
      date: new Date().toISOString(),
      veryImportant: finalPiles.veryImportant.map((v) => ({ id: v.id, title: v.title })),
      important: finalPiles.important.map((v) => ({ id: v.id, title: v.title })),
      notImportant: finalPiles.notImportant.map((v) => ({ id: v.id, title: v.title })),
    };
    saveToHistory(result);
    setPastResults(loadHistory());
  }, []);

  const handleTop5Confirm = useCallback(
    (selectedIds) => {
      setTop5Ids(selectedIds);
      saveResultToHistory(piles);
      setScreen('results');
    },
    [piles, saveResultToHistory]
  );

  const handleUndo = useCallback(() => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setPiles((prev) => ({
      ...prev,
      [last.pileId]: prev[last.pileId].slice(0, -1),
    }));
    setCards((prev) => [last.card, ...prev]);
  }, [history]);

  const handleFinishEarly = useCallback(() => {
    clearProgress();
    if (piles.veryImportant.length > TOP5_LIMIT) {
      setScreen('top5');
    } else {
      setTop5Ids(piles.veryImportant.map((v) => v.id));
      saveResultToHistory(piles);
      setScreen('results');
    }
  }, [piles, saveResultToHistory]);

  const handleStartOver = useCallback(() => {
    setCards([]);
    setPiles({ veryImportant: [], important: [], notImportant: [] });
    setHistory([]);
    setTop5Ids([]);
    clearProgress();
    setScreen('intro');
  }, []);

  return (
    <div className="app">
      <div className="app-content">
        {screen === 'intro' && (
          <IntroScreen
            email={email}
            setEmail={setEmail}
            emailConsent={emailConsent}
            setEmailConsent={setEmailConsent}
            onStart={handleStart}
            savedProgress={savedProgress}
            onResume={handleResume}
            friendName={friendName}
          />
        )}
        {screen === 'sorting' && (
          <SortingScreen
            currentCard={currentCard}
            totalCards={totalCards}
            sortedCount={sortedCount}
            piles={piles}
            onSort={handleSort}
            onUndo={handleUndo}
            onFinishEarly={handleFinishEarly}
            canUndo={history.length > 0}
          />
        )}
        {screen === 'top5' && (
          <Top5Screen
            veryImportant={piles.veryImportant}
            onConfirm={handleTop5Confirm}
          />
        )}
        {screen === 'results' && (
          <ResultsScreen
            piles={piles}
            top5Ids={top5Ids}
            email={email}
            onStartOver={handleStartOver}
            friendPiles={friendPiles}
            pastResults={pastResults}
            setPastResults={setPastResults}
          />
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

export default App;
