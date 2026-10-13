import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. AI Focus Director endpoint
app.post('/api/aura/director', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `User focus goal: "${prompt}". Configure an optimal AURA deep work environment.`,
        config: {
          systemInstruction: `You are the AURA Focus Director. Convert the user's study/work intent into a calm, architectural focus configuration.
Available sceneIds: "rainy-night", "midnight-cafe", "deep-forest", "moonlit-ocean", "winter-cabin", "deep-space", "cyberpunk-rain", "dark-library".
Available soundIds: "rain", "thunder", "wind", "ocean", "river", "leaves", "cafe", "fireplace", "city", "keyboard", "clock-tick", "spaceship", "brown-noise", "pink-noise", "lofi", "ambient-pad", "piano".
Available clockStyles: "minimal", "serif", "flip", "analog", "word".
Return a refined title, session structure, sceneId, soundMix (3-4 sounds with volumes 0.15 to 0.8), visualIntensity ("low" | "medium" | "high"), clockStyle, and a concise 1-sentence atmospheric note.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              taskName: { type: Type.STRING },
              sessionsCount: { type: Type.INTEGER },
              workMinutes: { type: Type.INTEGER },
              breakMinutes: { type: Type.INTEGER },
              sceneId: { type: Type.STRING },
              soundMix: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    soundId: { type: Type.STRING },
                    volume: { type: Type.NUMBER },
                  },
                  required: ['soundId', 'volume'],
                },
              },
              visualIntensity: { type: Type.STRING },
              clockStyle: { type: Type.STRING },
              directorNote: { type: Type.STRING },
            },
            required: [
              'title',
              'taskName',
              'sessionsCount',
              'workMinutes',
              'breakMinutes',
              'sceneId',
              'soundMix',
              'visualIntensity',
              'clockStyle',
              'directorNote',
            ],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        return res.json(parsed);
      }
    } catch (err) {
      console.error('Gemini Focus Director fallback triggered:', err);
    }
  }

  // Intelligent deterministic fallback if API key is unset or call fails
  const lower = prompt.toLowerCase();
  const isCoding = lower.includes('cod') || lower.includes('build') || lower.includes('program') || lower.includes('dev');
  const isReading = lower.includes('read') || lower.includes('book') || lower.includes('lit') || lower.includes('write');
  const isRelax = lower.includes('meditat') || lower.includes('sleep') || lower.includes('relax') || lower.includes('calm');

  return res.json({
    title: isCoding
      ? 'ARCHITECTURAL CODE FLOW'
      : isReading
      ? 'SCHOLARLY STILLNESS'
      : isRelax
      ? 'NOCTURNAL DECOMPRESSION'
      : 'DEEP WORK IMMERSION',
    taskName: prompt.length > 48 ? prompt.slice(0, 48) : prompt,
    sessionsCount: lower.includes('3') || lower.includes('three') ? 3 : lower.includes('4') || lower.includes('four') ? 4 : 2,
    workMinutes: isRelax ? 25 : 50,
    breakMinutes: isRelax ? 5 : 10,
    sceneId: isCoding ? 'rainy-night' : isReading ? 'dark-library' : isRelax ? 'moonlit-ocean' : 'dark-library',
    soundMix: isCoding
      ? [
          { soundId: 'rain', volume: 0.65 },
          { soundId: 'city', volume: 0.25 },
          { soundId: 'brown-noise', volume: 0.35 },
          { soundId: 'ambient-pad', volume: 0.3 },
        ]
      : [
          { soundId: 'rain', volume: 0.55 },
          { soundId: 'fireplace', volume: 0.6 },
          { soundId: 'brown-noise', volume: 0.3 },
        ],
    visualIntensity: 'low',
    clockStyle: isReading ? 'serif' : 'minimal',
    directorNote: 'Low-distraction acoustics paired with warm contrast to sustain uninterrupted cognitive depth.',
  });
});

// 2. AI Atmosphere Generator endpoint
app.post('/api/aura/atmosphere', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `User atmosphere description: "${prompt}". Convert this into a bespoke AURA atmospheric scene configuration.`,
        config: {
          systemInstruction: `You are the AURA Atmosphere Architect. Translate poetic spatial descriptions into a structured scene configuration.
Pick the closest baseSceneId from: "rainy-night", "midnight-cafe", "deep-forest", "moonlit-ocean", "winter-cabin", "deep-space", "cyberpunk-rain", "dark-library".
Pick custom hex accentColor (muted, low-saturation cinematic tone like #5B7C99, #C88A55, #5F8575, #7E6B9F).
Configure fogIntensity (0-100), particleIntensity (0-100), lightWarmth (0-100), soundMix (array of soundId + volume 0-1), and clockStyle ("minimal" | "serif" | "flip" | "analog" | "word").`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              baseSceneId: { type: Type.STRING },
              accentColor: { type: Type.STRING },
              fogIntensity: { type: Type.INTEGER },
              particleIntensity: { type: Type.INTEGER },
              lightWarmth: { type: Type.INTEGER },
              clockStyle: { type: Type.STRING },
              soundMix: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    soundId: { type: Type.STRING },
                    volume: { type: Type.NUMBER },
                  },
                  required: ['soundId', 'volume'],
                },
              },
            },
            required: [
              'name',
              'subtitle',
              'baseSceneId',
              'accentColor',
              'fogIntensity',
              'particleIntensity',
              'lightWarmth',
              'clockStyle',
              'soundMix',
            ],
          },
        },
      });

      if (response.text) {
        return res.json(JSON.parse(response.text.trim()));
      }
    } catch (err) {
      console.error('Gemini Atmosphere fallback triggered:', err);
    }
  }

  const lower = prompt.toLowerCase();
  const isTokyo = lower.includes('tokyo') || lower.includes('rain') || lower.includes('city') || lower.includes('neon');
  const isSpace = lower.includes('space') || lower.includes('orbit') || lower.includes('star') || lower.includes('cosmos');
  const isForest = lower.includes('forest') || lower.includes('wood') || lower.includes('tree') || lower.includes('mountain');

  return res.json({
    name: isTokyo ? '2:00 AM SHIBUYA RAIN' : isSpace ? 'ORBITAL STILLNESS' : isForest ? 'MISTY CEDAR SANCTUARY' : 'BESPOKE NOCTURNE',
    subtitle: prompt.slice(0, 70),
    baseSceneId: isTokyo ? 'rainy-night' : isSpace ? 'deep-space' : isForest ? 'deep-forest' : 'midnight-cafe',
    accentColor: isTokyo ? '#6082A6' : isSpace ? '#7B68A6' : isForest ? '#5E8271' : '#C98A5B',
    fogIntensity: 68,
    particleIntensity: 55,
    lightWarmth: isTokyo ? 40 : 75,
    clockStyle: 'minimal',
    soundMix: isTokyo
      ? [
          { soundId: 'rain', volume: 0.72 },
          { soundId: 'thunder', volume: 0.24 },
          { soundId: 'city', volume: 0.3 },
          { soundId: 'lofi', volume: 0.35 },
        ]
      : [
          { soundId: 'wind', volume: 0.45 },
          { soundId: 'ambient-pad', volume: 0.5 },
          { soundId: 'brown-noise', volume: 0.25 },
        ],
  });
});

// 3. AI Session Planner endpoint
app.post('/api/aura/planner', async (req, res) => {
  const { prompt, currentTime } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const startReference = currentTime || '19:30';
  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Current time is ${startReference}. User request: "${prompt}". Create a structured chronological focus schedule.`,
        config: {
          systemInstruction: `You are the AURA Session Planner. Break the user's available hours and subjects into a realistic, restorative sequence of deep focus blocks and short breaks starting at ${startReference}.
For each block specify: timeRange (e.g. "19:30 — 20:20"), label (e.g. "Physics: Mechanics"), type ("focus" | "break"), durationMinutes (integer), and recommendedSceneId ("rainy-night", "midnight-cafe", "deep-forest", "moonlit-ocean", "winter-cabin", "deep-space", "cyberpunk-rain", "dark-library").`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              planTitle: { type: Type.STRING },
              totalDurationLabel: { type: Type.STRING },
              blocks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timeRange: { type: Type.STRING },
                    label: { type: Type.STRING },
                    type: { type: Type.STRING },
                    durationMinutes: { type: Type.INTEGER },
                    recommendedSceneId: { type: Type.STRING },
                  },
                  required: ['timeRange', 'label', 'type', 'durationMinutes', 'recommendedSceneId'],
                },
              },
            },
            required: ['planTitle', 'totalDurationLabel', 'blocks'],
          },
        },
      });

      if (response.text) {
        return res.json(JSON.parse(response.text.trim()));
      }
    } catch (err) {
      console.error('Gemini Session Planner fallback triggered:', err);
    }
  }

  return res.json({
    planTitle: 'EVENING DEEP STUDY SEQUENCE',
    totalDurationLabel: '3h 30m structured flow',
    blocks: [
      {
        timeRange: '19:30 — 20:20',
        label: 'Primary Core Subject · Deep Synthesis',
        type: 'focus',
        durationMinutes: 50,
        recommendedSceneId: 'dark-library',
      },
      {
        timeRange: '20:20 — 20:30',
        label: 'Restorative Break · Stillness',
        type: 'break',
        durationMinutes: 10,
        recommendedSceneId: 'deep-forest',
      },
      {
        timeRange: '20:30 — 21:20',
        label: 'Problem Solving & Analytical Practice',
        type: 'focus',
        durationMinutes: 50,
        recommendedSceneId: 'rainy-night',
      },
      {
        timeRange: '21:20 — 21:30',
        label: 'Eye Rest & Box Breathing',
        type: 'break',
        durationMinutes: 10,
        recommendedSceneId: 'moonlit-ocean',
      },
      {
        timeRange: '21:30 — 22:20',
        label: 'Active Recall & Final Review',
        type: 'focus',
        durationMinutes: 50,
        recommendedSceneId: 'midnight-cafe',
      },
    ],
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AURA server listening on http://localhost:${PORT}`);
  });
}

startServer();
