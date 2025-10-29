<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gemini Voice Assistant with MCP Integration

A ChatGPT/Claude-style voice assistant powered by Google's Gemini API with Model Context Protocol (MCP) integration for real-time weather information and other tools.

## Features

✨ **Chat Interface**: Clean, modern ChatGPT/Claude-style UI
🎤 **Voice Conversation**: Natural voice interaction with real-time transcription
🌤️ **Weather Integration**: Real-time weather data via OpenWeather API
💬 **Conversation History**: Save and revisit past conversations
🔧 **MCP Tool Integration**: Extensible tool system for adding capabilities

View your app in AI Studio: https://ai.studio/apps/drive/1u6wtua2WppGdRVGBmAMAgd3cUNUlPxQ1

## Prerequisites

- Node.js (v18 or higher)
- A Gemini API key (get from [Google AI Studio](https://aistudio.google.com/apikey))
- An OpenWeather API key (get from [OpenWeather](https://openweathermap.org/api))

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Copy the template file:
```bash
cp .env.local.template .env.local
```

Edit `.env.local` and add your API keys:
```env
# Gemini API Key - required for voice conversation
GEMINI_API_KEY=your_gemini_api_key_here

# OpenWeather API Key - required for weather data
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### 3. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## How to Use

### Text Chat
1. Type your message in the input box at the bottom
2. Press Enter or click Send
3. The assistant will respond with text and voice

### Voice Conversation
1. Click the microphone button or "Start Voice Session"
2. Speak your question naturally
3. The assistant will transcribe and respond with voice
4. Click "End Voice Session" to stop

### Weather Queries
Ask questions like:
- "What's the weather in New York?"
- "Tell me the forecast for London for 5 days"
- "Is it raining in Tokyo?"
- "What's the temperature in Paris?"

The assistant will automatically detect weather queries and fetch real-time data.

## API Keys Setup

### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy the key and add it to `.env.local`

### OpenWeather API Key
1. Go to [OpenWeather](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key and add it to `.env.local`
5. Note: Free tier allows 1,000 calls/day

## Project Structure

```
gemini-live-conversation/
├── App.tsx                          # Main application component
├── components/
│   ├── ChatInput.tsx               # Message input component
│   ├── MessageList.tsx             # Chat messages display
│   ├── VoiceVisualizer.tsx         # Voice activity indicator
│   ├── ConversationHistoryPanel.tsx # History sidebar
│   └── Weather.tsx                 # Weather display component
├── services/
│   ├── EnhancedMCPClient.ts        # MCP client implementation
│   ├── WeatherService.ts           # Weather API integration
│   ├── conversationHistory.tsx     # Conversation persistence
│   └── audioUtils.ts               # Audio processing utilities
├── hooks/
│   └── useLiveConversation.ts      # Voice conversation hook
└── .env.local                       # Your API keys (not in git)
```

## MCP Integration

The Model Context Protocol (MCP) integration allows the assistant to use external tools. Currently implemented:

### Weather Tools
- **get_weather**: Get current weather for a location
- **get_forecast**: Get multi-day weather forecast

### Adding New Tools

To add new MCP tools:

1. Create a new service in `services/` (e.g., `NewsService.ts`)
2. Add tool configuration in `EnhancedMCPClient.ts`
3. Update the `analyzeQuery` method to detect relevant queries
4. Implement the tool call handler in `callTool` method

## Features Explained

### Conversation History
- All conversations are automatically saved to browser localStorage
- Click "History" to view past conversations
- Load previous conversations to continue them
- Delete individual conversations or clear all history

### Voice Transcription
- Real-time speech-to-text using Gemini's transcription
- Automatic silence detection triggers query processing
- Configurable silence timeout (default: 3 seconds)

### Weather Display
- Beautiful weather cards showing current conditions
- Multi-day forecast with high/low temperatures
- Automatic unit conversion (Celsius/Fahrenheit)
- Click to dismiss overlay

## Troubleshooting

### "API_KEY environment variable not set"
- Make sure you've created `.env.local` file
- Verify your Gemini API key is correctly copied
- Restart the dev server after adding keys

### "Weather service not initialized"
- Check that OPENWEATHER_API_KEY is in `.env.local`
- Verify the API key is valid on OpenWeather dashboard
- Free tier may have rate limits - check your usage

### Voice not working
- Grant microphone permissions when prompted
- Check browser console for errors
- Ensure you're using HTTPS or localhost
- Try using Chrome/Edge for best compatibility

### No voice output
- Check your system audio settings
- Verify browser has permission to play audio
- Try clicking the page first (browser autoplay policies)

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari (with limitations)
- ❌ Internet Explorer

## Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Privacy & Data

- Conversations are stored locally in your browser
- No data is sent to third-party servers except:
  - Google Gemini API (for AI responses)
  - OpenWeather API (for weather data)
- Clear history anytime from the History panel

## License

This project is provided as-is for educational and development purposes.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Verify all API keys are correctly configured

## Credits

- Powered by [Google Gemini API](https://ai.google.dev/)
- Weather data from [OpenWeather](https://openweathermap.org/)
- Built with React, TypeScript, and Vite
