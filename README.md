# ThinkDeck - Smart Study Cards

A modern flashcard application built with React, TypeScript, and Vite. Create, study, and master your learning materials with an intuitive drag-and-drop interface and beautiful 3D animations.

## ✨ Features

- 🧠 **Smart Learning**: Drag cards to "Review" or "Nailed it" folders
- 📤 **Import Support**: Upload CSV/Excel files with your flashcards
- 🎴 **Image Support**: Add images to your flashcards
- � **3D Animations**: Physics-based card flipping with bounce effects
- ✨ **Folder Glow**: Visual feedback when dragging cards
- 📱 **Grid View**: 4-column responsive layout for mini flashcards
- 🔄 **Reset Function**: Start fresh with all your cards
- 💾 **Auto-Save**: Your progress is automatically saved locally
- ⚡ **Fast**: Built with Vite for lightning-fast performance

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/thinkdeck.git
cd thinkdeck

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Building for Production

```bash
# Build the app
npm run build

# Preview the build
npm run preview
```

## 📋 How to Use

1. **Create Flashcards**: Click "Import Flashcards" to upload a CSV/Excel file or manually add cards
2. **Study Mode**: Click on any card to flip and see the answer
3. **Organize**: Drag cards to "Review" (orange glow) or "Nailed it" (green glow) folders
4. **Grid View**: Switch between study mode and grid view to see all your cards
5. **Reset**: Use the reset button to move all cards back to the main deck

## 📁 File Format

Your CSV/Excel files should have these columns:
- `Question`: The front of the card
- `Answer`: The back of the card  
- `ImageUrl`: (Optional) URL to an image for the card

## 🎨 Features in Detail

### 3D Physics Animations
- Cards flip with realistic bounce effects using CSS cubic-bezier animations
- Hover effects with subtle 3D transforms
- Drag feedback with wobble animations

### Smart Organization
- Automatic folder detection when dragging
- Visual feedback with folder glow effects
- Persistent storage of your progress

## 🛠️ Tech Stack

- **React 19** with TypeScript for type safety
- **Vite** for fast development and building  
- **CSS3** for 3D animations and responsive design
- **Papa Parse** for CSV file parsing
- **XLSX** for Excel file support
- **Local Storage** for data persistence

## 🚀 Deployment

This app is optimized for deployment on:
- **Vercel** (recommended)
- **Netlify** 
- **GitHub Pages**

## 📄 License

MIT License - feel free to use this for your own learning!

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
