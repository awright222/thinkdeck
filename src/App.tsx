import React, { useState, useEffect, useRef } from 'react';
import type { FlashcardDeck, ViewMode, FileUploadResult } from './types';
import { loadDecks, saveDeck, deleteDeck, generateId, downloadDeck, downloadTemplate, downloadExcelTemplate } from './storage';
import { parseFile, validateFileType } from './fileParser';
import FlashcardViewer from './FlashcardViewer';

function App() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('deck-list');
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load decks on mount
  useEffect(() => {
    const loadedDecks = loadDecks();
    setDecks(loadedDecks);
  }, []);

  const handleDeleteDeck = (deckId: string) => {
    if (window.confirm('Are you sure you want to delete this deck?')) {
      deleteDeck(deckId);
      setDecks(decks.filter(d => d.id !== deckId));
    }
  };

  const handleStudyDeck = (deck: FlashcardDeck) => {
    if (deck.cards.length === 0) {
      alert('This deck has no cards to study!');
      return;
    }
    setSelectedDeck(deck);
    setCurrentView('study');
  };

  const handleDeckUpdate = (updatedDeck: FlashcardDeck) => {
    const updatedDecks = decks.map(d => d.id === updatedDeck.id ? updatedDeck : d);
    setDecks(updatedDecks);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFileType(file)) {
      setUploadStatus('❌ Please upload a CSV or Excel file');
      return;
    }

    setIsLoading(true);
    setUploadStatus('📁 Processing file...');

    try {
      const result: FileUploadResult = await parseFile(file);

      if (result.success && result.cards) {
        const newDeck: FlashcardDeck = {
          id: generateId(),
          name: result.fileName?.replace(/\.[^/.]+$/, '') || 'Imported Deck',
          description: `Imported from ${result.fileName}`,
          cards: result.cards,
          createdAt: new Date(),
          tags: ['imported'],
        };

        saveDeck(newDeck);
        setDecks([...decks, newDeck]);
        setUploadStatus(`✅ Successfully imported ${result.cards.length} cards`);
        setCurrentView('deck-list');
      } else {
        setUploadStatus(`❌ ${result.error}`);
      }
    } catch (error) {
      setUploadStatus('❌ An unexpected error occurred');
      console.error('File upload error:', error);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      // Create a proper file input event
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      
      const changeEvent = new Event('change', { bubbles: true }) as any;
      changeEvent.target = fileInputRef.current;
      handleFileUpload(changeEvent);
    }
  };

  // Render different views
  const renderSidebar = () => (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="app-logo">
          <img src="/933fbd5c-51ef-47e2-a502-b0c4ebc0190c.png" alt="ThinkDeck Logo" />
          <h1>ThinkDeck</h1>
        </div>
        <p>Smart studying made simple</p>
      </div>
      
      <div className="sidebar-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            className={`btn btn-primary ${currentView === 'deck-list' ? 'btn-secondary' : ''}`}
            onClick={() => setCurrentView('deck-list')}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          >
            📚 My Decks ({decks.length})
          </button>
          
          <button 
            className={`btn btn-secondary ${currentView === 'create' ? 'btn-primary' : ''}`}
            onClick={() => setCurrentView('create')}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          >
            ➕ Create Deck
          </button>
          
          <button 
            className={`btn btn-secondary ${currentView === 'import' ? 'btn-primary' : ''}`}
            onClick={() => setCurrentView('import')}
            style={{ width: '100%' }}
          >
            📤 Import Cards
          </button>
        </div>

        {decks.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Decks
            </h3>
            {decks.slice(0, 3).map(deck => (
              <div 
                key={deck.id}
                className="deck-item"
                onClick={() => handleStudyDeck(deck)}
                style={{ marginBottom: '0.5rem', padding: '1rem', cursor: 'pointer' }}
              >
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: 600 }}>
                  {deck.name}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {deck.cards.length} cards
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDeckList = () => (
    <div className="main-content">
      <div className="animate-slide-in">
        <h2 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>
          📚 My Flashcard Decks
        </h2>

        {decks.length === 0 ? (
          <div className="card">
            <div className="card-body text-center">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
              <h3 style={{ marginBottom: '1rem' }}>No decks yet!</h3>
              <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                Create your first flashcard deck or import cards from a file to get started.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentView('create')}
                >
                  ➕ Create Deck
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setCurrentView('import')}
                >
                  📤 Import Cards
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="deck-list">
            {decks.map(deck => (
              <div key={deck.id} className="deck-item">
                <h3>{deck.name}</h3>
                {deck.description && <p>{deck.description}</p>}
                
                <div className="deck-meta">
                  <span>{deck.cards.length} cards</span>
                  <span>
                    Created {deck.createdAt.toLocaleDateString()}
                  </span>
                </div>
                
                <div className="deck-actions">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStudyDeck(deck);
                    }}
                    disabled={deck.cards.length === 0}
                  >
                    {deck.cards.length > 0 ? '🎯 Study' : '❌ No Cards'}
                  </button>
                  
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadDeck(deck);
                    }}
                    disabled={deck.cards.length === 0}
                  >
                    💾 Export
                  </button>
                  
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDeck(deck.id);
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateDeck = () => (
    <div className="main-content">
      <div className="animate-slide-in">
        <h2 style={{ marginBottom: '2rem' }}>📄 Create New Flashcard Deck</h2>
        
        <div className="card">
          <div className="card-body text-center">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ marginBottom: '1rem' }}>Template-Based Creation</h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
              To create flashcards, download one of our templates below, fill it out with your questions, 
              answers, and optional images, then import it back to create your deck.
            </p>
          </div>
        </div>

        {/* Template Download Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* CSV Template */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📊 CSV Template
              </h3>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Perfect for simple text editors or importing into spreadsheet applications.
                Works with Google Sheets, Excel, Numbers, and more.
              </p>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <li>Question/Answer columns</li>
                <li>Optional image URLs</li>
                <li>Example flashcards included</li>
              </ul>
              <button 
                className="btn btn-primary"
                onClick={downloadTemplate}
                style={{ width: '100%' }}
              >
                📥 Download CSV Template
              </button>
            </div>
          </div>

          {/* Excel Template */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📈 Excel Template
              </h3>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Enhanced template optimized for Microsoft Excel with additional formatting
                and instructions. Can also be opened in Google Sheets.
              </p>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <li>Pre-formatted columns</li>
                <li>Built-in examples</li>
                <li>Detailed instructions</li>
                <li>Excel-optimized formatting</li>
              </ul>
              <button 
                className="btn btn-primary"
                onClick={downloadExcelTemplate}
                style={{ width: '100%' }}
              >
                📥 Download Excel Template
              </button>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>🚀 How It Works</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  backgroundColor: 'var(--primary-color)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1rem',
                  fontSize: '1.5rem'
                }}>
                  1️⃣
                </div>
                <h4 style={{ marginBottom: '0.5rem' }}>Download Template</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Choose CSV or Excel format and download the template with examples
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  backgroundColor: 'var(--secondary-color)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1rem',
                  fontSize: '1.5rem'
                }}>
                  2️⃣
                </div>
                <h4 style={{ marginBottom: '0.5rem' }}>Fill Out Cards</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Add your questions, detailed answers, and optional image URLs
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  backgroundColor: 'var(--accent-color)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1rem',
                  fontSize: '1.5rem'
                }}>
                  3️⃣
                </div>
                <h4 style={{ marginBottom: '0.5rem' }}>Import & Study</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Upload your completed file to create your flashcard deck
                </p>
              </div>
            </div>
            
            {/* Image URL Guidelines */}
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              backgroundColor: 'var(--card-bg)', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)' 
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🖼️ Image Guidelines
              </h4>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                To add images to your flashcards, use URLs from these recommended sources:
              </p>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                <li><strong>Wikipedia Commons:</strong> Always works (e.g., https://upload.wikimedia.org/...)</li>
                <li><strong>Unsplash:</strong> Add ?w=256&h=256&fit=crop for optimal sizing</li>
                <li><strong>Your own website:</strong> Make sure CORS is enabled</li>
                <li><strong>Pixabay, Pexels:</strong> Most images work well</li>
              </ul>
              <div style={{ 
                padding: '1rem', 
                backgroundColor: 'rgba(255, 193, 7, 0.1)', 
                borderRadius: '6px', 
                fontSize: '0.9rem' 
              }}>
                <strong>⚠️ Note:</strong> Some image hosts (like Squarespace CDN, private servers) block cross-origin requests. 
                If an image doesn't display, try using one of the recommended sources above.
              </div>
            </div>
          </div>
        </div>

        {/* Quick Import Link */}
        <div className="card">
          <div className="card-body text-center">
            <h3 style={{ marginBottom: '1rem' }}>Ready to Upload?</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Already have a file ready to import?
            </p>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentView('import')}
            >
              📤 Go to Import Page
            </button>
          </div>
        </div>

        {/* Back to Decks */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setCurrentView('deck-list')}
          >
            ← Back to My Decks
          </button>
        </div>
      </div>
    </div>
  );

  const renderImport = () => (
    <div className="main-content">
      <div className="animate-slide-in">
        <h2 style={{ marginBottom: '2rem' }}>📤 Import Flashcards</h2>
        
        <div className="card">
          <div className="card-body">
            <div 
              className="file-upload"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <div className="file-upload-icon">
                {isLoading ? '⏳' : '📁'}
              </div>
              
              <div className="file-upload-text">
                {isLoading ? 'Processing file...' : (
                  <>
                    <strong>Click to upload</strong> or drag and drop your file here<br />
                    Supports CSV and Excel files (.csv, .xlsx, .xls)
                  </>
                )}
              </div>
              
              {!isLoading && (
                <button className="btn btn-primary">
                  Choose File
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                className="file-upload-input"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </div>
            
            {uploadStatus && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: uploadStatus.includes('❌') ? '#fed7d7' : '#c6f6d5',
                color: uploadStatus.includes('❌') ? '#c53030' : '#2f855a'
              }}>
                {uploadStatus}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>📋 File Format Requirements</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Your file should have columns with the following headers (case-insensitive):
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <strong>Required Columns:</strong>
                <ul style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>
                  <li><strong>Question</strong> (or Q, Front) - Your flashcard question/prompt</li>
                  <li><strong>Answer</strong> (or A, Back) - Detailed answer or notes</li>
                </ul>
              </div>
              <div>
                <strong>Optional Columns:</strong>
                <ul style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>
                  <li><strong>ImageUrl</strong> (or Image) - Web URL to image</li>
                </ul>
              </div>
            </div>

            {/* Template Download Button */}
            <div style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              padding: '1.5rem', 
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>
                📄 Need a Template?
              </h4>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
                Download our pre-formatted template with examples to get started quickly!
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-primary"
                  onClick={downloadTemplate}
                >
                  📥 CSV Template
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={downloadExcelTemplate}
                >
                  📈 Excel Template
                </button>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem'
            }}>
              <strong>Example CSV format:</strong><br />
              Question,Answer,ImageUrl<br />
              "What is the capital of France?","Paris - The City of Light, known for the Eiffel Tower",""<br />
              "What is photosynthesis?","Process converting sunlight to energy","https://example.com/diagram.jpg"
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  if (currentView === 'study' && selectedDeck) {
    return (
      <div className="app">
        {renderSidebar()}
        <FlashcardViewer
          deck={selectedDeck}
          onExit={() => {
            setCurrentView('deck-list');
            setSelectedDeck(null);
          }}
          onDeckUpdate={handleDeckUpdate}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {renderSidebar()}
      {currentView === 'deck-list' && renderDeckList()}
      {currentView === 'create' && renderCreateDeck()}
      {currentView === 'import' && renderImport()}
    </div>
  );
}

export default App;
