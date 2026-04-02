# pslpro

A precise facial aesthetics analyzer powered by Google's Gemini 2.0 Flash AI. Upload a photo or use your camera to receive an in-depth PSL (Pretty Scale of Looks) diagnostic report including feature-by-feature breakdowns, written analysis, and actionable looksmaxxing tips.

## Features

- **Real-time Camera Capture** — Use your device camera to take photos directly in the app
- **Image Upload** — Upload photos from your device or clipboard
- **PSL Score Analysis** — Get an accurate PSL score with percentile and tier classification
- **Feature Ratings** — Detailed 1–10 scores for 9 facial features:
  - Jawline
  - Cheekbones
  - Canthal tilt
  - Eye area
  - Nose
  - Chin
  - Symmetry
  - Facial thirds
  - Skin quality
- **Written Analysis** — Comprehensive breakdown of facial structure and harmony
- **Strengths & Weaknesses** — Bulleted lists identifying key assets and areas for improvement
- **Looksmaxxing Tips** — Actionable suggestions for maximizing facial aesthetics through methods like skincare, haircuts, styling, and fitness

## Tech Stack

- **Frontend Framework** — React 19 with TypeScript
- **Build Tool** — Vite 6
- **Styling** — Tailwind CSS 4 with Vite plugin
- **AI Model** — Google Gemini 2.0 Flash via [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)
- **Linting** — ESLint 9 with TypeScript support

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Google Gemini API key ([get one free](https://ai.google.dev/))

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will open at `http://localhost:5173` (default Vite port).

### Building for Production

```bash
npm run build
npm run preview  # Preview the production build locally
```

## Usage

1. **Paste Your API Key** — Enter your Google Gemini API key (stored only in your browser's local storage; never sent to servers)
2. **Add a Photo** — Either:
   - Click "Upload image" to select a file
   - Click "Use camera" to capture with your device camera
3. **Run Analysis** — Click "Run analysis" to submit
4. **Review Results** — Get your PSL score, feature ratings, analysis, and tips

## Project Structure

```
src/
├── App.tsx                 # Main app component
├── index.css               # Tailwind CSS configuration
├── main.tsx                # React root
├── components/
│   └── LoadingSpinner.tsx   # Loading indicator
├── lib/
│   ├── gemini.ts           # Gemini API integration
│   └── scoreColors.ts      # Color coding logic for scores
└── types/
    └── psl.ts              # TypeScript types and system prompt
```

## Environment

The app runs entirely in the browser. Your API key is:
- Stored in browser local storage (not uploaded anywhere)
- Used only to call Google's Gemini API directly from your device
- Never logged or persisted by this application

## Linting

```bash
npm run lint  # Check for code issues
```

## License

MIT

## Credits

Built with React, Vite, Tailwind CSS, and Google Gemini AI for Sillyhacks 2026.
