import type { FlashcardDeck, StudySession } from './types';

const STORAGE_KEYS = {
  DECKS: 'flashcard_decks',
  STUDY_SESSIONS: 'study_sessions',
  APP_SETTINGS: 'app_settings',
} as const;

export const loadDecks = (): FlashcardDeck[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (!stored) return [];
    
    const decks = JSON.parse(stored);
    return decks.map((deck: any) => ({
      ...deck,
      createdAt: new Date(deck.createdAt),
      lastStudied: deck.lastStudied ? new Date(deck.lastStudied) : undefined,
      cards: deck.cards.map((card: any) => ({
        ...card,
        lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
      })),
    }));
  } catch (error) {
    console.error('Error loading decks:', error);
    return [];
  }
};

export const saveDecks = (decks: FlashcardDeck[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  } catch (error) {
    console.error('Error saving decks:', error);
  }
};

export const saveDeck = (deck: FlashcardDeck): void => {
  const decks = loadDecks();
  const existingIndex = decks.findIndex(d => d.id === deck.id);
  
  if (existingIndex >= 0) {
    decks[existingIndex] = deck;
  } else {
    decks.push(deck);
  }
  
  saveDecks(decks);
};

export const deleteDeck = (deckId: string): void => {
  const decks = loadDecks();
  const filteredDecks = decks.filter(d => d.id !== deckId);
  saveDecks(filteredDecks);
};

export const getDeck = (deckId: string): FlashcardDeck | null => {
  const decks = loadDecks();
  return decks.find(d => d.id === deckId) || null;
};

// Study session management
export const saveStudySession = (session: StudySession): void => {
  try {
    const sessions = loadStudySessions();
    sessions.push(session);
    localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving study session:', error);
  }
};

export const loadStudySessions = (): StudySession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
    if (!stored) return [];
    
    const sessions = JSON.parse(stored);
    return sessions.map((session: any) => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
    }));
  } catch (error) {
    console.error('Error loading study sessions:', error);
    return [];
  }
};

// App settings
export const saveAppSettings = (settings: Record<string, any>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving app settings:', error);
  }
};

export const loadAppSettings = (): Record<string, any> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading app settings:', error);
    return {};
  }
};

// Utility functions
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const exportDeck = (deck: FlashcardDeck): string => {
  const csvContent = [
    'Question,Answer,ImageUrl',
    ...deck.cards.map(card => 
      `"${card.question.replace(/"/g, '""')}","${card.answer.replace(/"/g, '""')}","${card.imageUrl || ''}"`
    )
  ].join('\n');
  
  return csvContent;
};

export const downloadDeck = (deck: FlashcardDeck): void => {
  const csvContent = exportDeck(deck);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flashcards.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const downloadTemplate = (): void => {
  const templateContent = [
    'Question,Answer,ImageUrl',
    '"What is the capital of France?","Paris - The City of Light, known for the Eiffel Tower and rich cultural history.",""',
    '"What is 2 + 2?","4 - Basic arithmetic addition",""',
    '"What is the largest planet in our solar system?","Jupiter - A gas giant with over 70 moons and the famous Great Red Spot storm.",""',
    '"Who wrote Romeo and Juliet?","William Shakespeare - English playwright and poet (1564-1616)",""',
    '"What is the chemical symbol for gold?","Au - From the Latin word aurum, meaning shining dawn",""',
    '"What is photosynthesis?","The process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen.","https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Photosynthesis_en.svg/256px-Photosynthesis_en.svg.png"',
    '"What does the Eiffel Tower look like?","A 330-meter tall iron lattice tower in Paris, France.","https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/256px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg"',
    '"Sample with free image","Try using royalty-free images from Unsplash, Pixabay, or Wikipedia","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=256&h=256&fit=crop"'
  ].join('\n');
  
  const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'flashcard_template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const downloadExcelTemplate = async (): Promise<void> => {
  // Since we can't easily generate Excel files without additional dependencies,
  // we'll create a more detailed CSV that can be opened in Excel
  const templateContent = [
    'Question,Answer,ImageUrl',
    '"What is the capital of France?","Paris - The City of Light, known for the Eiffel Tower and rich cultural history.",""',
    '"What is 2 + 2?","4 - Basic arithmetic addition",""',
    '"What is the largest planet in our solar system?","Jupiter - A gas giant with over 70 moons and the famous Great Red Spot storm.",""',
    '"Who wrote Romeo and Juliet?","William Shakespeare - English playwright and poet (1564-1616)",""',
    '"What is the chemical symbol for gold?","Au - From the Latin word aurum, meaning shining dawn",""',
    '"What is photosynthesis?","The process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen.","https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Photosynthesis_en.svg/256px-Photosynthesis_en.svg.png"',
    '"What does the Eiffel Tower look like?","A 330-meter tall iron lattice tower in Paris, France.","https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/256px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg"',
    '"","","Instructions: Fill in your questions and answers. ImageUrl can be a web URL to any image or leave blank."'
  ].join('\n');
  
  const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'flashcard_template_for_excel.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
