import React, { useState, useRef } from 'react';
import type { FlashcardDeck, Flashcard } from './types';

interface FlashcardViewerProps {
  deck: FlashcardDeck;
  onExit: () => void;
  onDeckUpdate: (deck: FlashcardDeck) => void;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ deck, onExit, onDeckUpdate: _ }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);
  const [nailedCards, setNailedCards] = useState<Flashcard[]>([]);
  const [studyCards, setStudyCards] = useState<Flashcard[]>(deck.cards);
  const [gridFlippedCards, setGridFlippedCards] = useState<Set<string>>(new Set());
  
  // Simple drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredFolder, setHoveredFolder] = useState<'review' | 'nailed' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get the active cards based on current folder
  const getActiveCards = () => {
    switch (activeFolder) {
      case 'review': return reviewCards;
      case 'nailed': return nailedCards;
      default: return studyCards;
    }
  };

  const currentCard = getActiveCards()[currentIndex];

  // Switch to a different folder
  const switchToFolder = (folder: 'study' | 'review' | 'nailed') => {
    setActiveFolder(folder);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowGrid(false);
  };

  const toggleGridCard = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGridFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only flip if we haven't been dragging
    if (!isDragging) {
      e.preventDefault();
      setIsFlipped(!isFlipped);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Start dragging if moved more than 10px
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        setIsDragging(true);
        setDragOffset({ x: deltaX, y: deltaY });
        
        // Check folder hovering during drag
        const reviewFolder = document.querySelector('.folder.review');
        const nailedFolder = document.querySelector('.folder.nailed');
        
        if (reviewFolder || nailedFolder) {
          const mouseX = moveEvent.clientX;
          const mouseY = moveEvent.clientY;
          
          const reviewRect = reviewFolder?.getBoundingClientRect();
          const nailedRect = nailedFolder?.getBoundingClientRect();
          
          if (reviewRect && mouseX >= reviewRect.left && mouseX <= reviewRect.right && 
              mouseY >= reviewRect.top && mouseY <= reviewRect.bottom) {
            setHoveredFolder('review');
          } else if (nailedRect && mouseX >= nailedRect.left && mouseX <= nailedRect.right && 
                     mouseY >= nailedRect.top && mouseY <= nailedRect.bottom) {
            setHoveredFolder('nailed');
          } else {
            setHoveredFolder(null);
          }
        }
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const deltaX = upEvent.clientX - startX;
      const deltaY = upEvent.clientY - startY;
      const wasDragging = Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10;
      
      if (wasDragging) {
        // Check if card is dropped on a folder
        const reviewFolder = document.querySelector('.folder.review');
        const nailedFolder = document.querySelector('.folder.nailed');
        
        if (reviewFolder || nailedFolder) {
          const mouseX = upEvent.clientX;
          const mouseY = upEvent.clientY;
          
          const reviewRect = reviewFolder?.getBoundingClientRect();
          const nailedRect = nailedFolder?.getBoundingClientRect();
          
          if (reviewRect && mouseX >= reviewRect.left && mouseX <= reviewRect.right && 
              mouseY >= reviewRect.top && mouseY <= reviewRect.bottom) {
            moveCardToFolder('review');
          } else if (nailedRect && mouseX >= nailedRect.left && mouseX <= nailedRect.right && 
                     mouseY >= nailedRect.top && mouseY <= nailedRect.bottom) {
            moveCardToFolder('nailed');
          }
        }
      }
      
      // Reset drag state
      setTimeout(() => {
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
        setHoveredFolder(null);
      }, 50);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const moveCardToFolder = (folder: 'review' | 'nailed') => {
    if (!currentCard) return;

    // Remove card from current active folder
    const currentActiveCards = getActiveCards();
    const newActiveCards = currentActiveCards.filter((_, index) => index !== currentIndex);
    
    // Add card to target folder
    if (folder === 'review') {
      setReviewCards([...reviewCards, currentCard]);
    } else {
      setNailedCards([...nailedCards, currentCard]);
    }
    
    // Update the source folder
    if (activeFolder === 'study') {
      setStudyCards(newActiveCards);
    } else if (activeFolder === 'review') {
      setReviewCards(newActiveCards);
    } else if (activeFolder === 'nailed') {
      setNailedCards(newActiveCards);
    }
    
    // Move to next card or loop back
    if (newActiveCards.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= newActiveCards.length) {
      setCurrentIndex(0);
    }
    
    setIsFlipped(false);
  };

  const nextCard = () => {
    const activeCards = getActiveCards();
    if (activeCards.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeCards.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    const activeCards = getActiveCards();
    if (activeCards.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
    setIsFlipped(false);
  };

  const resetCards = () => {
    // Reset to original deck cards only (no duplicates)
    setStudyCards([...deck.cards]);
    setReviewCards([]);
    setNailedCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setActiveFolder('study');
    setShowGrid(false);
  };

  if (getActiveCards().length === 0) {
    if (activeFolder === 'study') {
      // Original completion logic for study cards
      return (
        <div className="main-content">
          <div className="card animate-slide-in">
            <div className="card-body text-center">
              <h2 className="mb-lg">🎉 All cards completed!</h2>
              <p>Great job! You've reviewed all the cards.</p>
              <div className="study-summary">
                <div className="summary-item">
                  <span className="summary-value">{reviewCards.length}</span>
                  <span className="summary-label">📚 Review pile</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">{nailedCards.length}</span>
                  <span className="summary-label">✅ Nailed it</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                <button onClick={resetCards} className="btn btn-primary">
                  Start Over
                </button>
                <button onClick={onExit} className="btn btn-secondary">
                  Finish Session
                </button>
              </div>
            </div>
          </div>
          
          <div className="folders-container">
            <div className="folder review">
              <div className="folder-header">📚 Review ({reviewCards.length})</div>
              <div className="folder-content">
                {reviewCards.map((card) => (
                  <div key={card.id} className="folder-card">
                    {card.question}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="folder nailed">
              <div className="folder-header">✅ Nailed it ({nailedCards.length})</div>
              <div className="folder-content">
                {nailedCards.map((card) => (
                  <div key={card.id} className="folder-card">
                    {card.question}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Empty folder message
      const folderName = activeFolder === 'review' ? 'Review' : 'Nailed';
      const folderEmoji = activeFolder === 'review' ? '📚' : '✅';
      
      return (
        <div className="main-content">
          <div className="card animate-slide-in">
            <div className="card-body text-center">
              <h2 className="mb-lg">{folderEmoji} No {folderName} Cards</h2>
              <p>This folder is empty. Go study some cards to add them here!</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                <button onClick={() => switchToFolder('study')} className="btn btn-primary">
                  Back to Study
                </button>
                <button onClick={onExit} className="btn btn-secondary">
                  Back to Decks
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="main-content">
      <div className="study-header">
        <div className="study-title">
          <h1>{deck.name} {activeFolder !== 'study' && `- ${activeFolder === 'review' ? '📚 Review' : '✅ Nailed'}`}</h1>
          <div className="progress-info">
            Card {currentIndex + 1} of {getActiveCards().length}
            {activeFolder !== 'study' && (
              <button 
                onClick={() => switchToFolder('study')} 
                className="btn btn-small"
                style={{ marginLeft: '1rem', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
              >
                ← Back to Study
              </button>
            )}
          </div>
        </div>
        <div className="study-controls">
          <button onClick={onExit} className="btn btn-secondary">
            ← Back to Decks
          </button>
          <button 
            onClick={resetCards}
            className="btn btn-warning"
            title="Move all cards back to study pile"
          >
            🔄 Reset All
          </button>
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className="btn btn-primary"
          >
            {showGrid ? '📄 Card View' : '⊞ Grid View'}
          </button>
        </div>
      </div>

      {showGrid ? (
        <div className="grid-container">
          <div className="grid-stats">
            <div className="stat-item">📚 Study: {studyCards.length}</div>
            <div className="stat-item">🔄 Review: {reviewCards.length}</div>
            <div className="stat-item">✅ Nailed: {nailedCards.length}</div>
          </div>
          
          <div className="cards-grid">
            <div className="grid-section">
              <h3>📚 Study Cards</h3>
              <div className="grid-cards">
                {studyCards.map((card, index) => (
                  <div 
                    key={card.id} 
                    className={`mini-flashcard ${index === currentIndex ? 'current' : ''} ${gridFlippedCards.has(card.id) ? 'flipped' : ''}`}
                    onClick={() => {
                      setCurrentIndex(index);
                      setShowGrid(false);
                    }}
                  >
                    <div className="mini-flashcard-inner">
                      <div className="mini-flashcard-face mini-flashcard-front">
                        <div className="mini-flashcard-label">Q</div>
                        <div className="mini-flashcard-content">
                          {card.imageUrl && (
                            <div className="mini-flashcard-image">
                              <img src={card.imageUrl} alt="Question" />
                            </div>
                          )}
                          <div className="mini-flashcard-text">{card.question}</div>
                        </div>
                        <button 
                          className="mini-flip-btn"
                          onClick={(e) => toggleGridCard(card.id, e)}
                          aria-label="Flip card"
                        >
                          ↻
                        </button>
                      </div>
                      <div className="mini-flashcard-face mini-flashcard-back">
                        <div className="mini-flashcard-label">A</div>
                        <div className="mini-flashcard-content">
                          <div className="mini-flashcard-text">{card.answer}</div>
                        </div>
                        <button 
                          className="mini-flip-btn"
                          onClick={(e) => toggleGridCard(card.id, e)}
                          aria-label="Flip card"
                        >
                          ↻
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="study-area">
            <div className="drag-indicators">
              <div className="drag-indicator left">📚 Review</div>
              <div className="drag-indicator right">✅ Nailed it</div>
            </div>
            
            <div className="study-layout">
              <div className={`folder review left-folder ${hoveredFolder === 'review' ? 'folder-glow' : ''}`} onClick={() => reviewCards.length > 0 && switchToFolder('review')}>
                <div className="folder-header">📚 Review ({reviewCards.length})</div>
                <div className="folder-content">
                  {reviewCards.slice(-3).map((card) => (
                    <div key={card.id} className="folder-card">
                      {card.question}
                    </div>
                  ))}
                  {reviewCards.length > 3 && (
                    <div className="folder-card more">+{reviewCards.length - 3} more</div>
                  )}
                </div>
              </div>

              <div className="flashcard-container">
                {currentCard && (
                  <div
                    ref={cardRef}
                    className={`flashcard ${isFlipped ? 'flipped' : ''} ${isDragging ? 'dragging' : ''}`}
                    style={{
                      transform: isDragging 
                        ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotateZ(${dragOffset.x * 0.1}deg)`
                        : ''
                    }}
                    onClick={handleCardClick}
                    onMouseDown={handleMouseDown}
                  >
                    <div className="flashcard-face flashcard-front">
                      <div className="flashcard-label">Question</div>
                      <div className="flashcard-content">
                        {currentCard.imageUrl && (
                          <div className="flashcard-image">
                            <img src={currentCard.imageUrl} alt="Question" />
                          </div>
                        )}
                        <div className="flashcard-text">{currentCard.question}</div>
                      </div>
                    </div>
                    <div className="flashcard-face flashcard-back">
                      <div className="flashcard-label">Answer</div>
                      <div className="flashcard-content">
                        <div className="flashcard-text">{currentCard.answer}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`folder nailed right-folder ${hoveredFolder === 'nailed' ? 'folder-glow' : ''}`} onClick={() => nailedCards.length > 0 && switchToFolder('nailed')}>
                <div className="folder-header">✅ Nailed it ({nailedCards.length})</div>
                <div className="folder-content">
                  {nailedCards.slice(-3).map((card) => (
                    <div key={card.id} className="folder-card">
                      {card.question}
                    </div>
                  ))}
                  {nailedCards.length > 3 && (
                    <div className="folder-card more">+{nailedCards.length - 3} more</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="study-controls">
            <button onClick={prevCard} disabled={studyCards.length <= 1} className="btn btn-secondary">
              ← Previous
            </button>
            <button onClick={() => setIsFlipped(!isFlipped)} className="btn btn-primary">
              {isFlipped ? 'Show Question' : 'Show Answer'}
            </button>
            <button onClick={nextCard} disabled={studyCards.length <= 1} className="btn btn-secondary">
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export { FlashcardViewer };
export default FlashcardViewer;
