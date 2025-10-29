# 🧪 Testing Guide - Example Queries

## Quick Test Checklist

Use this checklist to verify everything works:

```
☐ Text chat works
☐ Voice conversation starts
☐ Voice transcription appears
☐ Weather queries work
☐ Forecast queries work
☐ Regular chat (non-weather) works
☐ Conversation history saves
☐ Error handling works
☐ Voice session can be ended
☐ Messages display correctly
```

## 1. Basic Text Chat Tests

### Test 1: Simple Greeting
```
Input: "Hello!"
Expected: Friendly greeting response
Should work: ✅ Always
```

### Test 2: General Question
```
Input: "What is artificial intelligence?"
Expected: Detailed explanation
Should work: ✅ Always
```

### Test 3: Follow-up Question
```
Input: "Tell me more about that"
Expected: Continues previous context
Should work: ✅ Always
```

## 2. Weather Query Tests

### Test 4: Simple Weather Query
```
Input: "What's the weather in New York?"
Expected: 
  ✅ Tool indicator shows "Used get_weather"
  ✅ Weather card appears with current conditions
  ✅ Response mentions actual temperature and conditions
  ✅ Data includes: temp, humidity, wind, condition
```

### Test 5: Multiple Cities
```
Input: "What's the weather in London?"
Wait for response, then:
Input: "How about Tokyo?"
Expected: Different weather for each city
```

### Test 6: Temperature Specific
```
Input: "What's the temperature in Paris?"
Expected: Response focuses on temperature
```

### Test 7: Condition Specific
```
Input: "Is it raining in Seattle?"
Expected: Response mentions precipitation/rain status
```

### Test 8: Forecast Query
```
Input: "Show me the forecast for Chicago"
Expected:
  ✅ Tool shows "Used get_forecast"
  ✅ Forecast card with 3-day default
  ✅ High/low temperatures
  ✅ Conditions for each day
```

### Test 9: Multi-day Forecast
```
Input: "What's the 5-day forecast for Miami?"
Expected:
  ✅ 5 days of forecast data
  ✅ Each day has: date, high, low, condition
```

### Test 10: Week Forecast
```
Input: "Tell me the weather forecast for Los Angeles this week"
Expected: 7-day forecast (maximum)
```

## 3. Voice Conversation Tests

### Test 11: Voice Activation
```
Action: Click microphone button
Expected:
  ✅ Green "Listening" badge appears
  ✅ Voice visualizer shows blue rings
  ✅ Microphone permission granted (browser prompt)
```

### Test 12: Voice Input
```
Action: Speak "Hello, how are you?"
Expected:
  ✅ Transcript appears after 3 seconds of silence
  ✅ Message added to chat
  ✅ Response generated
  ✅ Voice plays response
```

### Test 13: Voice Weather Query
```
Action: Speak "What's the weather in Denver?"
Expected:
  ✅ Transcription captures city name
  ✅ Weather tool triggered
  ✅ Weather card displays
  ✅ Natural voice response
```

### Test 14: Voice Session End
```
Action: Click "End Voice Session"
Expected:
  ✅ Microphone stops
  ✅ Session ends cleanly
  ✅ Can start new session
```

## 4. Edge Cases & Error Tests

### Test 15: Invalid City
```
Input: "What's the weather in Fakecityname123?"
Expected:
  ❌ Tool error message
  ✅ Graceful error handling
  ✅ Helpful message to user
```

### Test 16: Ambiguous Location
```
Input: "What's the weather?"
Expected:
  ⚠️ Should not trigger tool (no location)
  ✅ General response about weather
```

### Test 17: Non-English City
```
Input: "What's the weather in München?" (Munich)
Expected:
  ✅ Should work if API supports it
  ⚠️ May need English name
```

### Test 18: Long Message
```
Input: [Very long message with 500+ characters]
Expected:
  ✅ Textarea expands
  ✅ Message sent successfully
  ✅ Response handles it
```

### Test 19: Special Characters
```
Input: "What's the weather in São Paulo?"
Expected:
  ✅ Handles accented characters
  ✅ Tool works correctly
```

### Test 20: Empty Message
```
Input: [Just spaces or empty]
Expected:
  ❌ Send button disabled
  ❌ Cannot send
```

## 5. Conversation History Tests

### Test 21: Save Conversation
```
Action: Have a 3+ message conversation
Action: Click "History"
Expected:
  ✅ Conversation appears in sidebar
  ✅ Title auto-generated from first message
  ✅ Shows message count
  ✅ Shows timestamp
```

### Test 22: Load Conversation
```
Action: Click a past conversation
Expected:
  ✅ All messages loaded
  ✅ Conversation appears in main view
  ✅ Can continue conversation
```

### Test 23: Delete Conversation
```
Action: Select conversation, click Delete
Expected:
  ✅ Confirmation prompt
  ✅ Conversation removed
  ✅ Still in localStorage until cleared
```

### Test 24: Clear All History
```
Action: Click "Clear All"
Expected:
  ✅ Confirmation prompt
  ✅ All conversations deleted
  ✅ Clean slate
```

## 6. UI/UX Tests

### Test 25: Responsive Design
```
Action: Resize browser window
Expected:
  ✅ Layout adapts to width
  ✅ Messages stack properly
  ✅ Input area remains accessible
```

### Test 26: Scroll Behavior
```
Action: Have 10+ messages
Expected:
  ✅ Auto-scrolls to latest
  ✅ Smooth scrolling
  ✅ Can manually scroll up
```

### Test 27: Loading States
```
Action: Send message
Expected:
  ✅ "Thinking..." indicator appears
  ✅ Send button shows spinner
  ✅ Input disabled while loading
```

### Test 28: Error Display
```
Action: [Trigger an error]
Expected:
  ✅ Red error banner at bottom
  ✅ Clear error message
  ✅ Can dismiss error
```

## 7. Performance Tests

### Test 29: Many Messages
```
Action: Generate 50+ messages
Expected:
  ✅ Smooth scrolling
  ✅ No lag in input
  ✅ Fast rendering
```

### Test 30: Rapid Messages
```
Action: Send messages quickly (5 in 10 seconds)
Expected:
  ✅ All processed correctly
  ✅ No race conditions
  ✅ Proper ordering
```

## 8. Tool Integration Tests

### Test 31: Tool Call Visibility
```
Input: "What's the weather in Boston?"
Expected:
  ✅ Message shows "⚡ Used get_weather"
  ✅ Can click "View data" to see raw response
  ✅ Tool result properly formatted
```

### Test 32: Mixed Queries
```
Input: "What's the weather in Austin? Also, tell me about Texas history."
Expected:
  ✅ Weather part uses tool
  ✅ History part uses general knowledge
  ✅ Combined natural response
```

### Test 33: Consecutive Tool Calls
```
Input: "Weather in NYC?"
Wait for response
Input: "Now for LA?"
Expected:
  ✅ Both trigger tools
  ✅ Each shows separate tool call
  ✅ Data not mixed up
```

## Expected Results Summary

### Weather Tool Response Format
```json
{
  "location": "New York",
  "country": "US",
  "temperature": 72,
  "feels_like": 70,
  "humidity": 65,
  "pressure": 1013,
  "condition": "Clear",
  "description": "clear sky",
  "wind_speed": 5.5,
  "clouds": 10,
  "units": "celsius",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### Forecast Tool Response Format
```json
{
  "location": "London",
  "country": "GB",
  "forecast": [
    {
      "date": "2024-01-15",
      "high": 15,
      "low": 8,
      "condition": "Cloudy",
      "humidity": 75,
      "precipitation": "No"
    },
    // ... more days
  ]
}
```

## Debugging Tips

### If Weather Doesn't Work:
1. Check browser console for errors
2. Verify OPENWEATHER_API_KEY in .env.local
3. Test API key directly: `https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_KEY`
4. Check API key status on OpenWeather dashboard
5. Verify you haven't exceeded rate limit (1000/day free tier)

### If Voice Doesn't Work:
1. Grant microphone permission
2. Check browser console
3. Ensure using HTTPS or localhost
4. Try Chrome/Edge (best support)
5. Check system audio input settings

### If Transcription Not Showing:
1. Check console for transcript messages
2. Verify `currentTranscript` state updates
3. Try speaking louder/clearer
4. Wait full 3 seconds after speaking
5. Check SILENCE_TIMEOUT_MS setting

### If Messages Not Appearing:
1. Check React DevTools
2. Verify messages state updates
3. Check conversationHistory service
4. Look for console errors
5. Clear browser cache

## Success Criteria

Your app is working correctly if:
- ✅ All 33 tests pass (or explain failures)
- ✅ Voice conversation is smooth
- ✅ Weather data is accurate and timely
- ✅ UI is responsive and professional
- ✅ No console errors during normal use
- ✅ Conversations save and load properly
- ✅ Tool integration is seamless

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "API_KEY not set" | Add keys to .env.local, restart dev server |
| Voice permission denied | Check browser settings, grant mic access |
| Weather shows error | Verify OpenWeather API key is valid |
| No transcription | Wait 3s after speaking, check console |
| Messages don't scroll | Check overflow-y-auto on container |
| Tool not triggered | Check query has location, keywords match |

## Performance Benchmarks

Target performance:
- ⚡ First message response: < 2s
- ⚡ Weather tool call: < 1s (API latency)
- ⚡ Voice transcription: Real-time
- ⚡ UI rendering: 60fps
- ⚡ Message send: < 100ms

Happy testing! 🧪✨
