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

function ResultsScreen({ piles, email, onStartOver }) {
  const handleEmailResults = useCallback(() => {
    // Build results text
    const buildList = (items) =>
      items.map((v) => `  - ${v.title}: ${v.description}`).join('\n');

    const body = [
      'PERSONAL VALUES CARD SORT RESULTS',
      '==================================\n',
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
  }, [piles, email]);

  return (
    <div className="results-screen">
      <h1>Your Results</h1>
      <p className="results-subtitle">
        Here&rsquo;s how you sorted your personal values
      </p>

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

  const totalCards = values.length;
  const sortedCount = totalCards - cards.length;
  const currentCard = cards[0] || null;

  const handleStart = useCallback(() => {
    setCards(shuffle(values));
    setPiles({ veryImportant: [], important: [], notImportant: [] });
    setScreen('sorting');
  }, []);

  const handleSort = useCallback(
    (pileId) => {
      if (!cards.length) return;
      const card = cards[0];
      setPiles((prev) => ({
        ...prev,
        [pileId]: [...prev[pileId], card],
      }));
      const remaining = cards.slice(1);
      setCards(remaining);
      if (remaining.length === 0) {
        setScreen('results');
      }
    },
    [cards]
  );

  const handleStartOver = useCallback(() => {
    setCards([]);
    setPiles({ veryImportant: [], important: [], notImportant: [] });
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
      {screen === 'results' && (
        <ResultsScreen
          piles={piles}
          email={email}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}

export default App;
