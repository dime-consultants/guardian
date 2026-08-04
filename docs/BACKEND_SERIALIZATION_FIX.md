# Backend: Fix JSON Serialization Error in chat/services.py

## Error Details
```
TypeError: Object of type function is not JSON serializable
  at chat/services.py line 298 in generate_chat_response()
```

## Root Cause
The `conversation_history` list passed to the OpenAI API contains a function object that cannot be JSON serialized. Even though line 290 checks `isinstance(entry, dict)`, something non-dict is still making it through.

## Solution

Edit `~/tools/ai_invoicing/chat/services.py` around line 285-295:

### Current Code (BROKEN):
```python
conv_history = []
for msg in conversation.messages.all().order_by("created_at"):
    entry = ChatMessageSerializer(msg).data
    if isinstance(entry, dict):
        conv_history.append(entry)
```

### Fixed Code:
```python
conv_history = []
for msg in conversation.messages.all().order_by("created_at"):
    entry = ChatMessageSerializer(msg).data
    if isinstance(entry, dict):
        # Ensure all values are JSON serializable
        cleaned_entry = {}
        for key, value in entry.items():
            # Skip non-serializable fields like functions
            if callable(value):
                continue
            # Convert non-string/int/float/bool/list/dict to string
            if not isinstance(value, (str, int, float, bool, list, dict, type(None))):
                cleaned_entry[key] = str(value)
            else:
                cleaned_entry[key] = value
        conv_history.append(cleaned_entry)
```

## Alternative Fix (Simpler)

If the issue is with specific fields, just exclude problematic fields:

```python
conv_history = []
for msg in conversation.messages.all().order_by("created_at"):
    entry = ChatMessageSerializer(msg).data
    if isinstance(entry, dict):
        # Only keep essential fields
        conv_history.append({
            "id": entry.get("id"),
            "role": entry.get("role"),
            "content": entry.get("content"),
            "created_at": entry.get("created_at"),
        })
```

## Debugging Steps

1. **Find the exact problem field**:
```python
# Add this before line 298
import json

try:
    json.dumps(conv_history)
except TypeError as e:
    print(f"[DEBUG] Serialization error: {e}")
    print(f"[DEBUG] conv_history: {conv_history}")
    for i, entry in enumerate(conv_history):
        try:
            json.dumps(entry)
        except TypeError:
            print(f"[DEBUG] Entry {i} has serialization issue:")
            for k, v in entry.items():
                try:
                    json.dumps({k: v})
                except TypeError:
                    print(f"  - Field '{k}' with value {type(v).__name__}: {v}")
    raise
```

2. **Check ChatMessageSerializer**:
```bash
# In ~/tools/ai_invoicing
grep -A 20 "class ChatMessageSerializer" chat/serializers.py

# Make sure it only includes serializable fields
# Watch for: method fields, callable properties, model instances
```

3. **Verify the fix**:
```bash
# Restart backend
docker compose down
docker compose up --build -d

# Check logs
docker compose logs -f invoicing-app

# Test in frontend - should not see "Object of type function is not JSON serializable"
```

## Files to Edit
- `~/tools/ai_invoicing/chat/services.py` - Line 285-295 area (fix conv_history building)
- `~/tools/ai_invoicing/chat/serializers.py` - Verify ChatMessageSerializer only has JSON-serializable fields

## Expected Result
After fix:
- No "Object of type function is not JSON serializable" error
- Chat messages successfully sent to OpenAI API
- Backend responds with proper assistant message
- Frontend receives and displays response

---
**File**: `chat/services.py`
**Line**: ~290
**Issue**: Non-serializable objects in conversation_history
**Fix**: Filter/clean non-JSON-serializable fields before passing to OpenAI API
