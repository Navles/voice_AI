<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1u6wtua2WppGdRVGBmAMAgd3cUNUlPxQ1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.local.template` to `.env.local` and set the required API keys:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `OPENWEATHER_API_KEY`: Your OpenWeather API key (get one at https://openweathermap.org/api)
3. Run the app:
   `npm run dev`

## API Keys

### Gemini API Key
Required for voice conversation features. Get your key from the Google AI Studio.

### OpenWeather API Key
Required for weather data features. Get a free API key at https://openweathermap.org/api
- Sign up for a free account
- Go to "API Keys" section
- Copy your API key
- Add it to .env.local as OPENWEATHER_API_KEY
