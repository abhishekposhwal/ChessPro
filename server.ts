import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header according to guidelines
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. API: Get AI move based on board FEN, history, and difficulty level
app.post('/api/ai/move', async (req: express.Request, res: express.Response) => {
  const { fen, history, difficulty, legalMoves } = req.body;

  if (!legalMoves || !Array.isArray(legalMoves) || legalMoves.length === 0) {
    res.status(400).json({ error: 'No legal moves provided' });
    return;
  }

  // Fallback Chess Engine Move: Select a random legal move if API key is not present
  const getRandomMove = () => {
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
  };

  if (!ai) {
    // Graceful fallback when Gemini API key is missing
    const chosen = getRandomMove();
    res.json({ ...chosen, note: 'Random Fallback (Gemini API Key missing in environment)' });
    return;
  }

  try {
    const historyText = history
      ? history.map((m: any, i: number) => `${i + 1}. ${m.color === 'w' ? 'White' : 'Black'}: ${m.san}`).join(', ')
      : 'None';

    const prompt = `You are playing a game of Chess as an opponent at difficulty level ${difficulty} (out of 5, where 1 is absolute beginner and 5 is Grandmaster level).
Current Position FEN: "${fen}"
Move History: "${historyText}"

List of legal moves you CAN make:
${JSON.stringify(legalMoves)}

Select EXACTLY ONE move from the provided list of legal moves that fits the requested difficulty of: Level ${difficulty}.
- At Level 1 (Beginner): Prioritize basic material trades, direct captures, or making solid but very passive moves. Sometimes ignore advanced long-term plans.
- At Level 3 (Intermediate): Play balanced positional chess, defend pieces, castle early, control the center, and spot simple 1-2 move tactical threats.
- At Level 5 (Advanced / Grandmaster): Make the absolute strongest tactical or strategic move, coordinate attack plans, restrict opponent options, and calculate deeply.

You must return your choice in the requested JSON structure. Select an option ONLY from the provided legal moves array: ${JSON.stringify(legalMoves)}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite chess engine advisor and opponent assistant. You choose a legal move that exactly matches the specified Elo difficulty level.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            from: { type: Type.STRING, description: 'The starting square from the chosen move ' },
            to: { type: Type.STRING, description: 'The destination square from the chosen move' },
            san: { type: Type.STRING, description: 'Standard algebraic notation' },
            promotion: { type: Type.STRING, description: 'p, q, r, n, b (optional promotion choice)' },
            explanation: { type: Type.STRING, description: 'A short 1-sentence thought on why this move was chosen' },
          },
          required: ['from', 'to', 'san'],
        },
      },
    });

    const text = response.text ? response.text.trim() : '';
    const selectedMove = JSON.parse(text);

    // Validate that the AI's move actually exists in the legal moves list
    const validatedMove = legalMoves.find(
      (m: any) => m.from.toLowerCase() === selectedMove.from.toLowerCase() && m.to.toLowerCase() === selectedMove.to.toLowerCase()
    );

    if (validatedMove) {
      res.json({
        ...validatedMove,
        explanation: selectedMove.explanation || 'Analyzed positional benefit.',
      });
    } else {
      // If AI fails to pick a legal move, fall back to a random legal move
      const fallback = getRandomMove();
      res.json({
        ...fallback,
        explanation: 'Fell back to safety move.',
        note: `AI suggested ${selectedMove.san || 'invalid square'}, which is not in the legal list. Play restored safely via engine fallback.`,
      });
    }
  } catch (error) {
    console.error('Gemini move API error:', error);
    res.json({
      ...getRandomMove(),
      explanation: 'Made an automated fallback calculation.',
    });
  }
});

// 2. API: Get positioning review and custom commentary on the current board
app.post('/api/ai/analyze', async (req: express.Request, res: express.Response) => {
  const { fen, history, sideToAnalyze } = req.body;

  if (!ai) {
    res.json({
      evaluation: 'N/A',
      commentary: 'Configure your GEMINI_API_KEY in the secrets menu to unleash local Chess grandmaster coaches and instant move analysis!',
      bestMove: 'None',
    });
    return;
  }

  try {
    const historyText = history
      ? history.map((m: any, i: number) => `${i + 1}. ${m.color === 'w' ? 'White' : 'Black'}: ${m.san}`).join(', ')
      : 'None';

    const prompt = `You are a professional chess coach reviewing a game. Analyze the position for the side: ${sideToAnalyze === 'w' ? 'White' : 'Black'}.
Current Position FEN: "${fen}"
Move History: "${historyText}"

Evaluate the position. Provide:
1. An overall evaluation score (e.g. "+1.2" for white advantage, "-0.8" for black advantage, "Equal", or "M1").
2. Insightful commentary about current pawns, piece coordination, threats, and tactical weaknesses.
3. A suggestion for the best immediate tactical move or strategic theme (e.g., control the open d-file, castle to safety, or push the pass-pawn).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an enthusiastic, clear-headed chess grandmaster coach who provides friendly, highly precise positional analysis.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            evaluation: { type: Type.STRING, description: 'Numerical evaluation or sign (+0.5, Equal, -2.4, etc.)' },
            commentary: { type: Type.STRING, description: 'Concise 2-3 sentence strategic coaching feedback' },
            bestMove: { type: Type.STRING, description: 'Recommended best move or strategic plan suggestion' },
          },
          required: ['evaluation', 'commentary', 'bestMove'],
        },
      },
    });

    const text = response.text ? response.text.trim() : '';
    res.json(JSON.parse(text));
  } catch (error) {
    console.error('Gemini Chess Analyze API error:', error);
    res.status(500).json({ error: 'Failed to generate chess analysis' });
  }
});

async function startServer() {
  // Vite integration middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
