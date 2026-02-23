import { useState, useCallback, useMemo } from 'react';
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

// --- Utilities ---

function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

function DroppablePile({ id, label, count, className }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`pile ${className} ${isOver ? 'pile-over' : ''}`}
    >
      <h3>{label}</h3>
      <span className="pile-count">
        {count} {count === 1 ? 'card' : 'cards'}
      </span>
    </div>
  );
}

// --- Narrowing Screen ---

function NarrowingScreen({ cards, targetCount, selected, onToggle, onConfirm, stepLabel }) {
  return (
    <div className="narrowing-screen">
      <h1>{stepLabel}</h1>
      <p className="narrowing-subtitle">
        Choose exactly <strong>{targetCount}</strong> values from the {cards.length} below.
        Tap a card to select or deselect it.
      </p>
      <div className="narrowing-counter">
        {selected.length} of {targetCount} selected
      </div>
      <div className="narrowing-grid">
        {cards.map((card) => {
          const isSelected = selected.some((s) => s.id === card.id);
          return (
            <button
              key={card.id}
              className={`narrowing-card ${isSelected ? 'narrowing-card-selected' : ''}`}
              onClick={() => onToggle(card)}
            >
              <div className="narrowing-card-title">{card.title}</div>
              <div className="narrowing-card-desc">{card.description}</div>
            </button>
          );
        })}
      </div>
      <button
        className="btn btn-primary"
        disabled={selected.length !== targetCount}
        onClick={onConfirm}
      >
        Continue with Top {targetCount}
      </button>
    </div>
  );
}

// --- Screens ---

function IntroScreen({ email, setEmail, onStart }) {
  return (
    <div className="intro">
      <h1>Personal Values Card Sort</h1>
      <p className="subtitle">Discover what matters most to you</p>
      <p className="attribution">
        Based on the Personal Values Card Sort by<br />
        W.R. Miller, J. C&rsquo;de Baca, D.B. Matthews, P.L. Wilbourne<br />
        University of New Mexico, 2001
      </p>
      <div className="instructions">
        <p>
          You will be shown <strong>83 value cards</strong> one at a time.
          For each card, sort it into one of three piles:
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          <strong>Very Important to Me</strong> &middot;{' '}
          <strong>Important to Me</strong> &middot;{' '}
          <strong>Not Important to Me</strong>
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          Drag each card to a pile, or use the buttons below the card.
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
        />
      </div>
      <button className="btn btn-primary" onClick={onStart}>
        Begin Sorting
      </button>
    </div>
  );
}

function SortingScreen({ currentCard, totalCards, sortedCount, piles, onSort }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { over } = event;
      if (over) {
        onSort(over.id);
      }
    },
    [onSort]
  );

  if (!currentCard) return null;

  return (
    <div className="sorting-screen">
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
              count={piles.notImportant.length}
              className="pile-not-important"
            />
            <DroppablePile
              id="important"
              label="Important to Me"
              count={piles.important.length}
              className="pile-important"
            />
            <DroppablePile
              id="veryImportant"
              label="Very Important to Me"
              count={piles.veryImportant.length}
              className="pile-very-important"
            />
          </div>

          <div className="quick-sort-buttons">
            <button
              className="btn btn-not-important"
              onClick={() => onSort('notImportant')}
            >
              Not Important
            </button>
            <button
              className="btn btn-important"
              onClick={() => onSort('important')}
            >
              Important
            </button>
            <button
              className="btn btn-very-important"
              onClick={() => onSort('veryImportant')}
            >
              Very Important
            </button>
          </div>

          <p className="sort-hint">
            Drag the card to a pile, or tap a button
          </p>
        </div>
      </DndContext>
    </div>
  );
}

function ResultsScreen({ piles, top10, top5, email, onStartOver }) {
  const hasNarrowing = top5.length > 0;
  const top5Ids = useMemo(() => new Set(top5.map((v) => v.id)), [top5]);
  const top10Ids = useMemo(() => new Set(top10.map((v) => v.id)), [top10]);

  const handleEmailResults = useCallback(() => {
    const buildList = (items) =>
      items.map((v) => `  - ${v.title}: ${v.description}`).join('\n');

    const sections = [
      'PERSONAL VALUES CARD SORT RESULTS',
      '==================================\n',
    ];

    if (top5.length > 0) {
      sections.push(
        `MY TOP 5 VALUES:`,
        buildList(top5),
        ''
      );
    }

    if (top10.length > 0 && top10.length !== top5.length) {
      const remaining10 = top10.filter((v) => !top5Ids.has(v.id));
      sections.push(
        `ALSO IN MY TOP 10:`,
        buildList(remaining10),
        ''
      );
    }

    sections.push(
      `\nVERY IMPORTANT TO ME (${piles.veryImportant.length}):`,
      buildList(piles.veryImportant),
      `\nIMPORTANT TO ME (${piles.important.length}):`,
      buildList(piles.important),
      `\nNOT IMPORTANT TO ME (${piles.notImportant.length}):`,
      buildList(piles.notImportant),
      '\n---',
      'Based on the Personal Values Card Sort by',
      "W.R. Miller, J. C'de Baca, D.B. Matthews, P.L. Wilbourne",
      'University of New Mexico, 2001',
    );

    const body = sections.join('\n');
    const subject = 'My Personal Values Card Sort Results';
    const mailtoLink = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  }, [piles, top10, top5, top5Ids, email]);

  return (
    <div className="results-screen">
      <h1>Your Results</h1>
      <p className="results-subtitle">
        Here&rsquo;s how you sorted your personal values
      </p>

      {hasNarrowing && (
        <div className="top-values-section">
          <div className="top-values-group top-5-group">
            <h2>Your Top 5 Values</h2>
            <div className="top-values-list">
              {top5.map((v) => (
                <div key={v.id} className="top-value-card top-5-card">
                  <div className="top-value-title">{v.title}</div>
                  <div className="top-value-desc">{v.description}</div>
                </div>
              ))}
            </div>
          </div>

          {top10.length > top5.length && (
            <div className="top-values-group top-10-group">
              <h2>Also in Your Top 10</h2>
              <div className="top-values-list">
                {top10
                  .filter((v) => !top5Ids.has(v.id))
                  .map((v) => (
                    <div key={v.id} className="top-value-card top-10-card">
                      <div className="top-value-title">{v.title}</div>
                      <div className="top-value-desc">{v.description}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="results-columns">
        <div className="results-column col-very-important">
          <h2>Very Important to Me</h2>
          <span className="column-count">
            {piles.veryImportant.length} values
          </span>
          {piles.veryImportant.map((v) => (
            <div
              key={v.id}
              className={`result-card ${top5Ids.has(v.id) ? 'result-card-top5' : top10Ids.has(v.id) ? 'result-card-top10' : ''}`}
            >
              <div className="result-title">
                {v.title}
                {top5Ids.has(v.id) && <span className="top-badge top-badge-5">Top 5</span>}
                {!top5Ids.has(v.id) && top10Ids.has(v.id) && <span className="top-badge top-badge-10">Top 10</span>}
              </div>
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

      <div className="results-actions">
        <button className="btn btn-primary" onClick={handleEmailResults}>
          Email My Results
        </button>
        <button className="btn btn-secondary" onClick={onStartOver}>
          Start Over
        </button>
      </div>

      <p className="results-attribution">
        Based on the Personal Values Card Sort by
        W.R. Miller, J. C&rsquo;de Baca, D.B. Matthews, P.L. Wilbourne
        &mdash; University of New Mexico, 2001
      </p>
    </div>
  );
}

// --- Main App ---

function App() {
  const [screen, setScreen] = useState('intro');
  const [email, setEmail] = useState('');
  const [cards, setCards] = useState([]);
  const [piles, setPiles] = useState({
    veryImportant: [],
    important: [],
    notImportant: [],
  });
  const [top10, setTop10] = useState([]);
  const [top5, setTop5] = useState([]);

  const totalCards = values.length;
  const sortedCount = totalCards - cards.length;
  const currentCard = cards[0] || null;

  const handleStart = useCallback(() => {
    // Subscribe to Kit form if configured
    const apiKey = import.meta.env.VITE_KIT_API_KEY;
    const formId = import.meta.env.VITE_KIT_FORM_ID;
    if (apiKey && formId && email) {
      fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, email }),
      }).catch(() => {});
    }

    setCards(shuffle(values));
    setPiles({ veryImportant: [], important: [], notImportant: [] });
    setTop10([]);
    setTop5([]);
    setScreen('sorting');
  }, [email]);

  const handleSort = useCallback(
    (pileId) => {
      if (!cards.length) return;
      const card = cards[0];
      setPiles((prev) => {
        const nextPiles = { ...prev, [pileId]: [...prev[pileId], card] };
        const remaining = cards.slice(1);
        if (remaining.length === 0) {
          const veryCount = nextPiles.veryImportant.length;
          if (veryCount > 10) {
            setScreen('narrowTop10');
          } else if (veryCount > 5) {
            setTop10(nextPiles.veryImportant);
            setScreen('narrowTop5');
          } else {
            setTop10(nextPiles.veryImportant);
            setTop5(nextPiles.veryImportant);
            setScreen('results');
          }
        }
        return nextPiles;
      });
      setCards((prev) => prev.slice(1));
    },
    [cards]
  );

  const handleToggleTop10 = useCallback((card) => {
    setTop10((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      if (exists) return prev.filter((c) => c.id !== card.id);
      if (prev.length >= 10) return prev;
      return [...prev, card];
    });
  }, []);

  const handleConfirmTop10 = useCallback(() => {
    if (top10.length > 5) {
      setScreen('narrowTop5');
    } else {
      setTop5(top10);
      setScreen('results');
    }
  }, [top10]);

  const handleToggleTop5 = useCallback((card) => {
    setTop5((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      if (exists) return prev.filter((c) => c.id !== card.id);
      if (prev.length >= 5) return prev;
      return [...prev, card];
    });
  }, []);

  const handleConfirmTop5 = useCallback(() => {
    setScreen('results');
  }, []);

  const handleStartOver = useCallback(() => {
    setCards([]);
    setPiles({ veryImportant: [], important: [], notImportant: [] });
    setTop10([]);
    setTop5([]);
    setScreen('intro');
  }, []);

  return (
    <div className="app">
      {screen === 'intro' && (
        <IntroScreen
          email={email}
          setEmail={setEmail}
          onStart={handleStart}
        />
      )}
      {screen === 'sorting' && (
        <SortingScreen
          currentCard={currentCard}
          totalCards={totalCards}
          sortedCount={sortedCount}
          piles={piles}
          onSort={handleSort}
        />
      )}
      {screen === 'narrowTop10' && (
        <NarrowingScreen
          cards={piles.veryImportant}
          targetCount={10}
          selected={top10}
          onToggle={handleToggleTop10}
          onConfirm={handleConfirmTop10}
          stepLabel="Narrow to Your Top 10"
        />
      )}
      {screen === 'narrowTop5' && (
        <NarrowingScreen
          cards={top10.length > 0 ? top10 : piles.veryImportant}
          targetCount={5}
          selected={top5}
          onToggle={handleToggleTop5}
          onConfirm={handleConfirmTop5}
          stepLabel="Narrow to Your Top 5"
        />
      )}
      {screen === 'results' && (
        <ResultsScreen
          piles={piles}
          top10={top10}
          top5={top5}
          email={email}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}

export default App;
