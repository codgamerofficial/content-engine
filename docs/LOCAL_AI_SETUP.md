# Local AI Setup for Musify

Musify now supports **free, open-source AI models** for creating Instagram reels. This document explains the setup and usage.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Musify App                               │
│                    (Next.js + API Routes)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Local AI Client (src/lib/ai-client-local.ts)      │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │  Ollama/Llava   │    │  Groq/Llama 3   │    │ Edge-TTS     │ │
│  │  (Image→Script) │    │  (Text Gen)     │    │ (Voiceover)  │ │
│  └────────┬────────┘    └────────┬────────┘    └──────┬──────┘ │
│           │                       │                     │        │
│           ▼                       ▼                     ▼        │
│    ┌─────────────┐        ┌─────────────┐      ┌─────────────┐  │
│    │ Local Model │        │ Cloud Free  │      │ Free Cloud  │  │
│    │ (8GB VRAM)  │        │ (20 RPM)    │      │ TTS         │  │
│    └─────────────┘        └─────────────┘      └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### 1. Ollama (Required for Image Analysis)

**Download:** https://ollama.com

**Install Llava Model:**
```bash
# Windows
ollama pull llava:7b-v1.6

# Verify installation
ollama list
```

**System Requirements:**
- 8GB RAM (for Llava 7B)
- Windows 10+/macOS/Linux

**Start Ollama Server:**
```bash
# Keep this running in a terminal
ollama serve
```

### 2. Groq API (Free Tier for Text Generation)

1. **Get API Key:** https://console.groq.com
2. **Free Tier Limits:**
   - 20 requests per minute
   - 10K tokens per day
   - Sufficient for development/testing

### 3. Edge TTS (Optional - Voiceovers)

For free voiceovers, set up a local TTS server:
```bash
# Option A: Use edge-tts npm package
npm install edge-tts

# Create a simple server script
cat > tts-server.js << 'EOF'
const edgeTTS = require('edge-tts');
const http = require('http');

const PORT = 8000;

const server = http.createServer(async (req, res) => {
    if (req.url === '/tts' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { text, voice } = JSON.parse(body);
                const audio = await edgeTTS.getAudio(text, voice || 'en-US-GuyNeural');
                res.writeHead(200, { 'Content-Type': 'audio/mp3' });
                res.end(audio);
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => console.log(`TTS server running on port ${PORT}`));
EOF

node tts-server.js
```

## Environment Configuration

1. **Copy example env file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit .env.local:**
   ```env
   # Ollama (local)
   OLLAMA_HOST=http://localhost:11434

   # Groq (free cloud)
   GROQ_API_KEY=your_key_here

   # Gemini (fallback)
   GEMINI_API_KEY=your_key_here
   ```

## Usage

### Generate Reel from Product Image

```typescript
import { localAIClient } from '@/lib/ai-client-local';

const imageBase64 = /* base64 encoded image */;

const result = await localAIClient.generateReelContent(imageBase64, {
    goal: 'reach', // 'reach' | 'engagement' | 'conversion'
    includeVoiceover: true,
});

console.log(result.script);
// Output: { hook, body, cta, hashtags, caption, ... }
```

### API Endpoint

```bash
POST /api/generate-reel
{
    "imageBase64": "data:image/jpeg;base64,...",
    "goal": "reach"
}
```

### Fallback Order

1. **Primary:** Ollama (local Llava) - Free, runs on your machine
2. **Secondary:** Groq (Llama 3 cloud) - Free tier available
3. **Tertiary:** Gemini - Fallback if above unavailable

## Troubleshooting

### Ollama Not Starting
```bash
# Check if port is in use
netstat -an | findstr 11434

# Kill existing process
taskkill /F /IM ollama.exe

# Restart
ollama serve
```

### Groq Rate Limits
- Wait 60 seconds between requests
- Or use local Ollama as primary

### Out of Memory
- Ollama requires ~8GB RAM for Llava 7B
- Use smaller model: `ollama pull llava:7b-v1.6-vicuna`
- Or run without GPU: `ollama run llava:7b`

## Performance Notes

| Model | Speed | Quality | Cost |
|-------|-------|---------|------|
| Ollama Llava | ~5-10s/image | Good | Free |
| Groq Llama 3 | ~1s | Excellent | Free tier |
| Gemini | ~2s | Good | Paid/fallback |

## File Changes Summary

| File | Action |
|------|--------|
| `src/lib/ai-client-local.ts` | Created - New local AI client |
| `src/lib/ai-client.ts` | Updated - Added local fallback |
| `src/lib/agents/reel-script.ts` | Updated - AI-powered generation |
| `src/app/api/generate-reel/route.ts` | Updated - Image-based API |
| `package.json` | Updated - Added dependencies |
| `.env.example` | Created - Environment config |

## Next Steps

1. Install Ollama and pull Llava model
2. Get Groq API key
3. Copy `.env.example` to `.env.local`
4. Start `ollama serve`
5. Test: `npm run dev`
