import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensors,
  useSensor,
} from '@dnd-kit/core';
import values from './data/values';
import './App.css';

// --- Constants ---

const STORAGE_KEY = 'values-sort-progress';
const HISTORY_KEY = 'values-sort-history';
const TOP5_LIMIT = 5;

const VALUE_CONFLICTS = [
  ['ACHIEVEMENT', 'INNER PEACE',  'Big goals and a quiet mind don\'t always want the same things.'],
  ['AUTHORITY',   'HUMILITY',     'Leading others and staying modest pull in different directions.'],
  ['AUTONOMY',    'COOPERATION',  'Independence and deep collaboration both take up space.'],
  ['ADVENTURE',   'SAFETY',       'The draw toward new experiences and the need for security show up in every big decision.'],
  ['COMFORT',     'CHALLENGE',    'Growth usually costs comfort. Comfort usually costs growth.'],
  ['SOLITUDE',    'POPULARITY',   'Time alone and wanting to be known by many are hard to serve equally.'],
  ['WEALTH',      'GENEROSITY',   'Keeping and giving pull against each other, especially when resources feel limited.'],
  ['RATIONALITY', 'PASSION',      'Logic and feeling don\'t always point the same direction.'],
  ['ORDER',       'CHANGE',       'Systems and stability sit uneasily with growth and newness.'],
  ['MODERATION',  'ADVENTURE',    'Balance and boldness are not always compatible.'],
  ['COMMITMENT',  'AUTONOMY',     'Deep loyalty and full independence are in constant negotiation.'],
  ['ROMANCE',     'SOLITUDE',     'Intense connection and time alone both need a lot from you.'],
];

// --- Utilities ---

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

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
  } catch { /* ignore */ }
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
  } catch { /* ignore */ }
}

function saveToHistory(result) {
  try {
    const existing = loadHistory();
    existing.push(result);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function toBase64Url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return atob(b64);
}

function encodeResults(piles, top5Ids) {
  const compact = {
    v: piles.veryImportant.map((v) => v.id),
    i: piles.important.map((v) => v.id),
    n: piles.notImportant.map((v) => v.id),
  };
  if (top5Ids && top5Ids.length > 0) compact.t = top5Ids;
  return toBase64Url(JSON.stringify(compact));
}

function buildResultsUrl(piles, top5Ids, firstName) {
  const encoded = encodeResults(piles, top5Ids);
  let url = `${window.location.origin}${window.location.pathname}?results=${encoded}`;
  if (firstName) url += `&name=${encodeURIComponent(firstName)}`;
  return url;
}

function decodeResults(encoded) {
  try {
    const compact = JSON.parse(fromBase64Url(encoded));
    const findValue = (id) => values.find((v) => v.id === id);
    return {
      veryImportant: (compact.v || []).map(findValue).filter(Boolean),
      important: (compact.i || []).map(findValue).filter(Boolean),
      notImportant: (compact.n || []).map(findValue).filter(Boolean),
      top5Ids: compact.t || [],
    };
  } catch {
    return null;
  }
}

// --- Build Piles ---

function buildPiles(allCards, sortMap) {
  return {
    veryImportant: allCards.filter(c => sortMap[c.id] === 'very'),
    important:     allCards.filter(c => sortMap[c.id] === 'imp'),
    notImportant:  allCards.filter(c => sortMap[c.id] === 'not'),
  };
}

// --- Draggable Value Card (grid) ---

function DraggableValueCard({ card, sortState, isSelected, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(card.id),
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 100, position: 'relative' }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`val-card${sortState ? ' s-' + sortState : ''}${isDragging ? ' dragging' : ''}${isSelected ? ' fb-active' : ''}`}
      onClick={() => onSelect(card.id)}
    >
      <span className="eyebrow pile-tag pile-tag-not eyebrow-rose">Not important</span>
      <span className="eyebrow pile-tag pile-tag-imp eyebrow-fig">Important</span>
      <span className="eyebrow pile-tag pile-tag-very eyebrow-sage">Very important</span>
      <div className="val-name">{card.title}</div>
      <div className="val-desc">{card.description}</div>
    </div>
  );
}

// --- Droppable Zone ---

function DroppableZone({ pile, label, eyebrowClass, chips }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'zone-' + pile });
  return (
    <div ref={setNodeRef} className={`zone z-${pile}${isOver ? ' drag-over' : ''}`}>
      <div className="zone-top">
        <span className={`eyebrow ${eyebrowClass}`} style={{ marginBottom: 0 }}>{label}</span>
        <div className="zone-count">{chips.length} {chips.length === 1 ? 'card' : 'cards'}</div>
      </div>
      <div className="zone-chips">
        {chips.map(card => (
          <div key={card.id} className="zone-chip">{card.title}</div>
        ))}
      </div>
    </div>
  );
}

// --- Grid Sort Screen (shared: Round 1, 2, 3) ---

function GridSortScreen({
  roundNum, totalRounds, cards, sortMap, batchIndex,
  onSort, onNextBatch, onContinue, onBack,
  continueLabel, headerTitle, headerCopy, footerNote, onDevSkip,
}) {
  const useBatches = cards.length > 9;
  const BATCH_SIZE = 9;

  const batchCards = useBatches
    ? cards.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE)
    : cards;

  const batchComplete = batchCards.every(c => sortMap[c.id] != null);
  const allComplete = cards.every(c => sortMap[c.id] != null);
  const unsortedCount = cards.filter(c => sortMap[c.id] == null).length;
  const progressPct = cards.length > 0 ? ((cards.length - unsortedCount) / cards.length) * 100 : 0;

  const sortedForPile = (pile) => cards.filter(c => sortMap[c.id] === pile);

  const [selectedId, setSelectedId] = useState(null);
  const footerRef = useRef(null);

  useEffect(() => {
    if (allComplete && footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [allComplete]);

  const handleCardClick = (cardId) => {
    setSelectedId(prev => prev === cardId ? null : cardId);
  };

  const handleFallback = (pile) => {
    if (!selectedId) return;
    onSort(selectedId, pile);
    setSelectedId(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over) return;
    const cardId = parseInt(active.id);
    const pile = over.id.replace('zone-', '');
    onSort(cardId, pile);
    if (selectedId === cardId) setSelectedId(null);
  }, [onSort, selectedId]);

  return (
    <div className="round-screen">

      {/* Header card */}
      <div className="card gap-cards">
        <div className="card-body">
          <p className="round-meta">Round {roundNum} of {totalRounds}</p>
          <h1 className="card-title">{headerTitle}</h1>
          {headerCopy}
        </div>
        <div className="progress-strip">
          <div className="step-dots">
            {Array.from({ length: totalRounds }, (_, i) => (
              <div key={i} className={`dot${i === roundNum - 1 ? ' active' : ''}`} />
            ))}
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="progress-label">{unsortedCount} of {cards.length} remaining</div>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>

        {/* Cards batch */}
        <div className="gap-section">
          <div className="section-instruction">Drag each card into a pile, or tap to select it first.</div>
          <div className="val-grid">
            {batchCards.map(card => (
              <DraggableValueCard
                key={card.id}
                card={card}
                sortState={sortMap[card.id] || null}
                isSelected={selectedId === card.id}
                onSelect={handleCardClick}
              />
            ))}
          </div>
        </div>

        {/* Drop zones */}
        <div className="gap-section">
          <div className="section-label">Your piles</div>
          <div className="zones-grid">
            <DroppableZone pile="not"  label="Not Important to Me"  eyebrowClass="eyebrow-rose"    chips={sortedForPile('not')} />
            <DroppableZone pile="imp"  label="Important to Me"      eyebrowClass="eyebrow-fig"     chips={sortedForPile('imp')} />
            <DroppableZone pile="very" label="Very Important to Me" eyebrowClass="eyebrow-sage" chips={sortedForPile('very')} />
          </div>
        </div>

      </DndContext>

      {/* Floating tray — sort fallback OR batch advance */}
      {(() => {
        const selectedCard = selectedId ? cards.find(c => c.id === selectedId) : null;
        const trayOpen = !!selectedId || (useBatches && batchComplete);
        const trayMode = selectedId ? 'sort' : 'advance';
        return (
          <div className={`sort-tray${trayOpen ? ' open' : ''}`}>
            {trayMode === 'sort' ? (
              <>
                <div className="sort-tray-label">{selectedCard ? selectedCard.title : ''}</div>
                <div className="sort-tray-btns">
                  <button className="fallback-btn fb-not"  onClick={() => handleFallback('not')}>Not important</button>
                  <button className="fallback-btn fb-imp"  onClick={() => handleFallback('imp')}>Important</button>
                  <button className="fallback-btn fb-very" onClick={() => handleFallback('very')}>Very important</button>
                </div>
              </>
            ) : (
              <>
                <div className="sort-tray-label">
                  {allComplete ? 'All cards sorted' : 'Batch complete'}
                </div>
                <div className="sort-tray-btns">
                  <button
                    className="sort-tray-advance"
                    onClick={allComplete ? onContinue : onNextBatch}
                  >
                    {allComplete ? continueLabel : 'Next batch \u2192'}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Footer */}
      <div className="footer-card" ref={footerRef}>
        <p className="footer-note">{footerNote}</p>
        {onDevSkip && (
          <button onClick={onDevSkip} style={{ fontSize: 11, color: '#999', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            dev: skip
          </button>
        )}
        <div className="btn-row">
          <button className="btn-ghost" onClick={onBack}>Back</button>
          <button
            className="btn-primary"
            onClick={allComplete ? onContinue : undefined}
            disabled={!allComplete}
            style={{ opacity: allComplete ? 1 : 0.35, cursor: allComplete ? 'pointer' : 'not-allowed' }}
          >
            {continueLabel}
          </button>
        </div>
      </div>

    </div>
  );
}

// --- Site Nav ---

function SiteNav() {
  return (
    <div className="lp-nav-bar">
      <nav className="lp-nav">
        <a href="https://alisonrose.nl" className="lp-nav-logo">Values Card Sort</a>
        <ul className="lp-nav-links">
          <li><a href="https://alisonrose.nl/toolkit">Resources</a></li>
          <li><a href="https://alisonrose.nl/contact">Contact</a></li>
        </ul>
      </nav>
    </div>
  );
}

// --- Site Footer ---

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="sf-brand">
        Values Card Sort
      </div>
      <div className="sf-links">
        <a href="https://alisonrose.nl/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
        <span className="sf-sep">&middot;</span>
        <a href="https://alisonrose.nl/terms" target="_blank" rel="noopener noreferrer">Terms</a>
        <span className="sf-sep">&middot;</span>
        <a href="https://alisonrose.nl" target="_blank" rel="noopener noreferrer">alisonrose.nl</a>
      </div>
      <p className="sf-disclaimer">For entertainment and self-reflection purposes only.<br />Not a substitute for professional advice.</p>
      <div className="sf-also">
        Also by Alison Rose:{' '}
        <a href="https://alignment.alisonrose.nl" target="_blank" rel="noopener noreferrer">In Alignment</a>
        <span className="sf-sep">&middot;</span>
        <a href="https://www.alisonrose.nl/the-rare-company-club" target="_blank" rel="noopener noreferrer">The Rare Company Club</a>
      </div>
      <p className="sf-credit">
        Adapted from the Personal Values Card Sort by W.R. Miller, J. C&rsquo;de Baca,
        D.B. Matthews &amp; P.L. Wilbourne, University of New Mexico, 2001
      </p>
      <p className="sf-legal">A. Rose Creative &middot; The Netherlands</p>
    </footer>
  );
}

// --- Screens ---

function IntroScreen({ firstName, setFirstName, email, setEmail, emailConsent, setEmailConsent, onStart, savedProgress, onResume, friendName }) {
  const canStart = firstName.trim() && email && email.includes('@');

  return (
    <div className="landing-page">

      {/* Nav */}
      <SiteNav />

      {/* Hero + Form */}
      <section className="lp-hero">
        {friendName && (
          <div className="lp-compare-banner">
            <strong>{friendName}</strong> invited you to compare values.
            Complete your sort to see how you match up.
          </div>
        )}
        <div className="lp-eyebrow-row">
          <span className="lp-eyebrow">Free Tool</span>
          <span className="lp-eyebrow lp-eyebrow-sage">Self-Discovery</span>
          <span className="lp-eyebrow lp-eyebrow-rose">15 Minutes</span>
        </div>
        <h1>You already know what<br />you value. <em>Sort it out.</em></h1>
        <p className="lp-subhead">A card sort that turns a vague sense of your priorities into a short, specific list.</p>
        <p className="lp-body-copy">Work through a deck of 49 values, sort them into piles, and narrow down to the five that fit right now.</p>

        <div className="lp-form-panel">
          <p className="lp-form-intro">Leave your email and I&rsquo;ll send your results when you&rsquo;re done.</p>
          <div className="lp-email-form">
            <div className="lp-field">
              <label htmlFor="lp-first-name">First name</label>
              <input
                id="lp-first-name"
                type="text"
                className="lp-email-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="lp-field">
              <label htmlFor="lp-email">Email</label>
              <input
                id="lp-email"
                type="email"
                className="lp-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              className="lp-btn-primary lp-btn-full"
              onClick={onStart}
              disabled={!canStart}
              style={{ opacity: canStart ? 1 : 0.4, cursor: canStart ? 'pointer' : 'not-allowed' }}
            >
              Start sorting
            </button>
          </div>
          {savedProgress && (
            <button className="lp-resume-btn" onClick={onResume}>
              Resume where you left off ({savedProgress.sortedCount}&nbsp;/&nbsp;{values.length} done)
            </button>
          )}
          <label className="lp-consent">
            <input
              type="checkbox"
              checked={emailConsent}
              onChange={(e) => setEmailConsent(e.target.checked)}
            />
            <span>
              I agree to receive emails from Alison Rose.{' '}
              <a href="https://www.alisonrose.nl/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy</a>
              {' '}&amp;{' '}
              <a href="https://www.alisonrose.nl/terms-conditions" target="_blank" rel="noopener noreferrer">Terms</a>.
            </span>
          </label>
          <p className="lp-capture-fine">Unsubscribe anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />

    </div>
  );
}

function Top5Screen({ pool, onConfirm, onBack }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= TOP5_LIMIT) return prev;
      return [...prev, id];
    });
  };

  const progressPct = (selectedIds.length / TOP5_LIMIT) * 100;

  return (
    <div className="round-screen">

      <div className="card gap-cards">
        <div className="card-body">
          <p className="round-meta">Round 2 of 2</p>
          <h1 className="card-title">Choose your top five.</h1>
          <p>These are the values that shape everything. Pick the five that feel non-negotiable right now.</p>
        </div>
        <div className="progress-strip">
          <div className="step-dots">
            <div className="dot" />
            <div className="dot active" />
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="progress-label">{selectedIds.length} of {TOP5_LIMIT} chosen</div>
        </div>
      </div>

      <div className="gap-section">
        <div className="section-label">Your shortlist</div>
        <div className="val-grid">
          {pool.map((v) => (
            <div
              key={v.id}
              className={`val-card top5-selectable${selectedIds.includes(v.id) ? ' s-very' : ''}`}
              onClick={() => toggle(v.id)}
            >
              <span className="eyebrow pile-tag pile-tag-very eyebrow-sage">Very important to me</span>
              <div className="val-name">{v.title}</div>
              <div className="val-desc">{v.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-card">
        <p className="footer-note">Your five core values.</p>
        {import.meta.env.DEV && (
          <button onClick={() => onConfirm(pool.slice(0, TOP5_LIMIT).map(v => v.id))} style={{ fontSize: 11, color: '#999', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            dev: skip
          </button>
        )}
        <div className="btn-row">
          <button className="btn-ghost" onClick={onBack}>Back</button>
          <button
            className="btn-primary"
            onClick={() => onConfirm(selectedIds)}
            disabled={selectedIds.length !== TOP5_LIMIT}
            style={{ opacity: selectedIds.length === TOP5_LIMIT ? 1 : 0.35, cursor: selectedIds.length === TOP5_LIMIT ? 'pointer' : 'not-allowed' }}
          >
            Confirm my top five
          </button>
        </div>
      </div>

    </div>
  );
}

function ResultsScreen({ piles, top5Ids, firstName, email, onStartOver }) {
  const canvasRef = useRef(null);

  const top5Values = top5Ids.length > 0
    ? piles.veryImportant.filter((v) => top5Ids.includes(v.id))
    : piles.veryImportant.slice(0, 5);

  // Detect value conflicts in the very important pile
  const conflicts = VALUE_CONFLICTS.filter(([a, b]) => {
    const titles = piles.veryImportant.map((v) => v.title);
    return titles.includes(a) && titles.includes(b);
  });

  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyResultsLink = useCallback(() => {
    const url = buildResultsUrl(piles, top5Ids, firstName);
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }).catch(() => {
      prompt('Copy this link to save your results:', url);
    });
  }, [piles, top5Ids, firstName]);

  const handleShare = useCallback(() => {
    const encoded = encodeResults(piles, top5Ids);
    const name = firstName || email.split('@')[0];
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
  }, [piles, top5Ids, firstName, email]);

  const handleDownloadImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Wait for fonts to be ready so Quincy CF renders correctly
    document.fonts.ready.then(() => {
      const ctx = canvas.getContext('2d');
      const scale = 2;
      const w = 1080;
      const pad = 72;
      const headerH = 220;
      const cardH = 96;
      const cardGap = 12;
      const footerH = 80;

      const displayValues = top5Values.length > 0 ? top5Values : piles.veryImportant.slice(0, 5);
      const cardsH = displayValues.length * (cardH + cardGap) - cardGap;
      const h = headerH + 48 + cardsH + 48 + footerH;

      canvas.width = w * scale;
      canvas.height = h * scale;
      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = '#F8F8F6';
      ctx.fillRect(0, 0, w, h);

      // Sage-light header band
      ctx.fillStyle = '#EBEFEE';
      ctx.fillRect(0, 0, w, headerH);

      // Eyebrow label
      ctx.fillStyle = '#1E4457';
      ctx.font = '500 13px "Work Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '0.11em';
      ctx.fillText('VALUES CARD SORT', w / 2, 64);
      ctx.letterSpacing = '0';

      // Quincy CF headline
      const headline = firstName ? `${firstName}\u2019s top five values.` : 'My top five values.';
      ctx.fillStyle = '#1A1916';
      ctx.font = 'bold 52px "Quincy CF", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(headline, w / 2, 148);

      // Mustard rule under header
      ctx.fillStyle = '#9F6C26';
      ctx.fillRect(0, headerH - 3, w, 3);

      // Value cards
      const cardX = pad;
      const cardW = w - pad * 2;
      let cardY = headerH + 48;

      displayValues.forEach((v, i) => {
        // Card background — white with rule border
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#E2E0DC';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 8);
        ctx.fill();
        ctx.stroke();

        // Rank number — Quincy CF, sage-mid
        ctx.fillStyle = '#F2E0D6';
        ctx.font = 'bold 64px "Quincy CF", Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}`, cardX + 20, cardY + cardH / 2 + 22);

        // Title — Quincy CF, title case
        ctx.fillStyle = '#1A1916';
        ctx.font = '400 22px "Quincy CF", Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText(toTitleCase(v.title), cardX + 110, cardY + 38);

        // Description
        ctx.fillStyle = '#4A4845';
        ctx.font = '400 15px "Work Sans", sans-serif';
        ctx.fillText(v.description, cardX + 110, cardY + 64);

        cardY += cardH + cardGap;
      });

      // Footer
      const footerY = cardY + 32;
      ctx.fillStyle = '#9F6C26';
      ctx.font = '400 14px "Work Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('values.alisonrose.nl', w / 2, footerY);

      // Download / Share
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], 'MyValuesSortResults.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file] }).catch(() => {});
        } else {
          const link = document.createElement('a');
          link.download = 'MyValuesSortResults.png';
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
        }
      }, 'image/png');
    });
  }, [piles, top5Values, firstName]);

  return (
    <div className="results-screen">

      {/* Headline */}
      <div className="res-headline">
        <p className="res-title">Your values, sorted.</p>
        <p className="res-subtitle">Print these out. Save the link. Come back when you&rsquo;re making a decision and want to check in with yourself.</p>
      </div>

      {/* Top 5 */}
      <div className="gap-section">
        <div className="res-top5-grid">
          {top5Values.map((v, i) => (
            <div key={v.id} className="res-value-card">
              <div className="res-value-number">{i + 1}</div>
              <div className="res-value-content">
                <div className="res-value-name">{toTitleCase(v.title)}</div>
                <div className="res-value-def">{v.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="card res-actions-card gap-cards">
        <div className="res-actions-body">
          <div className="res-actions-row">
            <button className="res-btn-primary" onClick={handleCopyResultsLink}>
              {linkCopied ? 'Copied!' : 'Save my results link'}
            </button>
            <button className="res-btn-secondary" onClick={handleDownloadImage}>Download image</button>
            <button className="res-btn-secondary" onClick={handleShare}>Share with a friend</button>
          </div>
        </div>
      </div>

      {/* Tensions */}
      {conflicts.length > 0 && (
        <div className="card gap-section">
          <div className="card-body">
            <span className="eyebrow res-eyebrow-rose" style={{ marginBottom: 16 }}>Where things pull</span>
            <p className="res-tensions-intro">A few of your values sit in tension with each other. The friction is usually where the interesting decisions live.</p>
            {conflicts.map(([a, b, note], i) => (
              <div key={i} className="res-tension-pair">
                <div className="res-tension-values">
                  <div className="res-tension-value">{toTitleCase(a)}</div>
                  <div className="res-tension-arrow">&harr;</div>
                  <div className="res-tension-value">{toTitleCase(b)}</div>
                </div>
                <div className="res-tension-note">{note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RCC */}
      <div className="card res-rcc-card gap-section">
        <div className="res-rcc-body-wrap">
          <img src="/RCCLogoStacked.png" alt="The Rare Company Club" className="res-rcc-logo" />
          <p className="res-rcc-title">A room built around exactly this.</p>
          <p className="res-rcc-body">The online home for self-employed folks who want their work to reflect who they actually are. If that feels like you, check it out with a 7 day free trial.</p>
          <a className="res-btn-rcc" href="https://www.alisonrose.nl/the-rare-company-club" target="_blank" rel="noopener noreferrer">Join the Club</a>
          <a href="https://www.alisonrose.nl/in-alignment" target="_blank" rel="noopener noreferrer" className="res-rcc-secondary">
            Use your values as the foundation for your astrology business profile. <span>Try In Alignment &rarr;</span>
          </a>
        </div>
      </div>

      {/* Full breakdown */}
      <div className="gap-section">
        <h2 className="res-section-heading">Your full sort</h2>
        <div className="res-breakdown-grid">
          <div className="res-breakdown-col">
            <span className="eyebrow res-eyebrow-sage">Very Important</span>
            <span className="res-breakdown-count">{piles.veryImportant.length} values</span>
            <ul className="res-breakdown-list">
              {piles.veryImportant.map(v => (
                <li key={v.id} className="res-breakdown-item">
                  <div className="res-breakdown-name">{toTitleCase(v.title)}</div>
                  <div className="res-breakdown-def">{v.description}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="res-breakdown-col">
            <span className="eyebrow res-eyebrow-fig">Important</span>
            <span className="res-breakdown-count">{piles.important.length} values</span>
            <ul className="res-breakdown-list">
              {piles.important.map(v => (
                <li key={v.id} className="res-breakdown-item">
                  <div className="res-breakdown-name">{toTitleCase(v.title)}</div>
                  <div className="res-breakdown-def">{v.description}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="res-breakdown-col">
            <span className="eyebrow res-eyebrow-rose">Not Important</span>
            <span className="res-breakdown-count">{piles.notImportant.length} values</span>
            <ul className="res-breakdown-list">
              {piles.notImportant.map(v => (
                <li key={v.id} className="res-breakdown-item">
                  <div className="res-breakdown-name">{toTitleCase(v.title)}</div>
                  <div className="res-breakdown-def">{v.description}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Start over */}
      <div className="res-start-over">
        <button className="res-btn-ghost" onClick={onStartOver}>Start over</button>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

    </div>
  );
}

// --- Kit (email marketing) ---

const KIT_WORKER_URL = 'https://winter-heart-bee7.alison-bba.workers.dev';

function subscribeToKit(email, firstName, resultsUrl) {
  fetch(KIT_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, firstName, resultsUrl }),
  }).catch(() => {});
}

// --- Main App ---

function readUrlInit() {
  const params = new URLSearchParams(window.location.search);

  const resultsData = params.get('results');
  if (resultsData) {
    const decoded = decodeResults(resultsData);
    if (decoded) {
      return {
        screen: 'results',
        finalPiles: decoded,
        top5Ids: decoded.top5Ids || [],
        firstName: params.get('name') || '',
        friendName: '',
      };
    }
  }

  let friendName = '';
  const compareData = params.get('compare');
  if (compareData) {
    const decoded = decodeResults(compareData);
    if (decoded) {
      const fromName = params.get('from');
      if (fromName) friendName = decodeURIComponent(fromName);
    }
  }

  return {
    screen: 'intro',
    finalPiles: { veryImportant: [], important: [], notImportant: [] },
    top5Ids: [],
    firstName: '',
    friendName,
  };
}

function App() {
  const [urlInit] = useState(readUrlInit);
  const [screen, setScreen] = useState(urlInit.screen);

  // User info
  const [firstName, setFirstName] = useState(urlInit.firstName);
  const [email, setEmail] = useState('');
  const [emailConsent, setEmailConsent] = useState(false);

  // Round 1
  const [round1Cards, setRound1Cards] = useState([]);
  const [round1Sorts, setRound1Sorts] = useState({});
  const [round1Batch, setRound1Batch] = useState(0);


  // Top 5 pool + final state
  const [top5Pool, setTop5Pool] = useState([]);
  const [top5Ids, setTop5Ids] = useState(urlInit.top5Ids);
  const [finalPiles, setFinalPiles] = useState(urlInit.finalPiles);

  // Social / history
  const [friendName] = useState(urlInit.friendName);
  const [savedProgress, setSavedProgress] = useState(() => {
    const saved = loadProgress();
    return saved && saved.round === 'round1' ? saved : null;
  });

  // Auto-save round 1 progress
  useEffect(() => {
    if (screen === 'round1' && Object.keys(round1Sorts).length > 0) {
      saveProgress({
        round: 'round1',
        round1Cards,
        round1Sorts,
        round1Batch,
        firstName,
        email,
        sortedCount: Object.keys(round1Sorts).length,
      });
    }
  }, [screen, round1Cards, round1Sorts, round1Batch, firstName, email]);

  // Subscribe to Kit when results are ready
  const kitSentRef = useRef(false);
  useEffect(() => {
    if (screen === 'results' && email && emailConsent && !kitSentRef.current) {
      kitSentRef.current = true;
      const resultsUrl = buildResultsUrl(finalPiles, top5Ids, firstName);
      subscribeToKit(email, firstName, resultsUrl);
    }
  }, [screen, email, emailConsent, firstName, finalPiles, top5Ids]);

  const handleStart = useCallback(() => {
    const shuffled = shuffle(values);
    setRound1Cards(shuffled);
    setRound1Sorts({});
    setRound1Batch(0);
    setTop5Pool([]);
    setTop5Ids([]);
    setFinalPiles({ veryImportant: [], important: [], notImportant: [] });
    setSavedProgress(null);
    clearProgress();
    kitSentRef.current = false;
    setScreen('round1');
  }, []);

  const handleResume = useCallback(() => {
    if (!savedProgress) return;
    setRound1Cards(savedProgress.round1Cards);
    setRound1Sorts(savedProgress.round1Sorts);
    setRound1Batch(savedProgress.round1Batch);
    if (savedProgress.firstName) setFirstName(savedProgress.firstName);
    if (savedProgress.email) setEmail(savedProgress.email);
    setSavedProgress(null);
    setScreen('round1');
  }, [savedProgress]);

  const handleSort = useCallback((cardId, pile) => {
    setRound1Sorts(prev => ({ ...prev, [cardId]: pile }));
  }, []);

  const handleNextBatch = useCallback(() => {
    setRound1Batch(prev => prev + 1);
  }, []);

  const handleDevSkip = useCallback(() => {
    const autoSorts = {};
    round1Cards.forEach((c, i) => {
      autoSorts[c.id] = i < 12 ? 'very' : i < 24 ? 'imp' : 'not';
    });
    setRound1Sorts(autoSorts);
    const veryCards = round1Cards.slice(0, 12);
    setTop5Pool(veryCards);
    clearProgress();
    setScreen('top5');
  }, [round1Cards]);

  const handleContinueToTop5 = useCallback(() => {
    clearProgress();
    const veryCards = round1Cards.filter(c => round1Sorts[c.id] === 'very');
    if (veryCards.length < 5) {
      const impCards = round1Cards.filter(c => round1Sorts[c.id] === 'imp');
      setTop5Pool([...veryCards, ...impCards]);
    } else {
      setTop5Pool(veryCards);
    }
    setScreen('top5');
  }, [round1Cards, round1Sorts]);

  const saveResultToHistory = useCallback((piles) => {
    const result = {
      date: new Date().toISOString(),
      veryImportant: piles.veryImportant.map(v => ({ id: v.id, title: v.title })),
      important: piles.important.map(v => ({ id: v.id, title: v.title })),
      notImportant: piles.notImportant.map(v => ({ id: v.id, title: v.title })),
    };
    saveToHistory(result);
  }, []);

  const handleTop5Confirm = useCallback((selectedIds) => {
    const piles = buildPiles(round1Cards, round1Sorts);
    setTop5Ids(selectedIds);
    setFinalPiles(piles);
    saveResultToHistory(piles);
    setScreen('results');
  }, [round1Cards, round1Sorts, saveResultToHistory]);

  const handleStartOver = useCallback(() => {
    setRound1Cards([]);
    setRound1Sorts({});
    setRound1Batch(0);
    setTop5Pool([]);
    setTop5Ids([]);
    setFinalPiles({ veryImportant: [], important: [], notImportant: [] });
    kitSentRef.current = false;
    clearProgress();
    setScreen('intro');
  }, []);

  return (
    <div className="app">
      {screen !== 'intro' && <SiteNav />}
      <div className="app-content">
        {screen === 'intro' && (
          <IntroScreen
            firstName={firstName}
            setFirstName={setFirstName}
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
        {screen === 'round1' && (
          <GridSortScreen
            roundNum={1}
            totalRounds={2}
            cards={round1Cards}
            sortMap={round1Sorts}
            batchIndex={round1Batch}
            onSort={handleSort}
            onNextBatch={handleNextBatch}
            onContinue={handleContinueToTop5}
            onBack={() => setScreen('intro')}
            onDevSkip={import.meta.env.DEV ? handleDevSkip : undefined}
            continueLabel="Choose my top five"
            headerTitle="Sort every card into a pile."
            headerCopy={
              <>
                <p>Go with your first instinct. The values you are actually living, right now.</p>
                <p>Drag each card into one of the three piles. Three seconds is enough.</p>
              </>
            }
            footerNote="Your very important pile carries into round two."
          />
        )}
        {screen === 'top5' && (
          <Top5Screen
            pool={top5Pool}
            onConfirm={handleTop5Confirm}
            onBack={() => setScreen('round1')}
          />
        )}
        {screen === 'results' && (
          <ResultsScreen
            piles={finalPiles}
            top5Ids={top5Ids}
            firstName={firstName}
            email={email}
            onStartOver={handleStartOver}
          />
        )}
      </div>
      {screen !== 'intro' && <SiteFooter />}
    </div>
  );
}

export default App;
