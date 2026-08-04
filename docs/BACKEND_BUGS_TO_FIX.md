# Backend Bugs to Fix in Django Backend

## Status
- **Bug 3 (Frontend)**: ✅ FIXED - Chat page now uses `accessToken` from context via `apiFetch`
- **Bug 1 (Backend)**: 🔴 NEEDS FIX - Invalid field in ChatMessageSerializer
- **Bug 2 (Backend)**: 🔴 NEEDS FIX - Function object in conversation_history

## Bug 1: Invalid `related_batch` Field in ChatMessageSerializer

**Location**: `~/tools/ai_invoicing/chat/serializers.py`

**Issue**: The `ChatMessageSerializer` includes `"related_batch"` in the fields list, but this field doesn't exist on the `ChatMessage` model.

**Fix**:
```python
class ChatMessageSerializer(serializers.ModelSerializer):
    attachments = ChatMessageAttachmentSerializer(many=True, read_only=True)
    applied_workflow_name = serializers.CharField(
        source='applied_workflow.name', read_only=True
    )
    
    class Meta:
        model = ChatMessage
        fields = [
            "id", "role", "content", "created_at",
            # "related_batch",  <-- REMOVE THIS LINE
            "applied_workflow", "applied_workflow_name", "attachments"
        ]
        read_only_fields = ["created_at", "applied_workflow"]
```

**Command to fix**:
```bash
nano ~/tools/ai_invoicing/chat/serializers.py
# Find and remove the line containing "related_batch"
```

## Bug 2: Non-Serializable Function Object in conversation_history

**Location**: `~/tools/ai_invoicing/chat/views.py` around line 152

**Issue**: The `conversation_history` list passed to `generate_chat_response` contains a non-JSON-serializable object (likely a function or method reference).

**Root Cause**: The `conv_history` list is being built but something non-serializable is sneaking in. Possible causes:
- Passing the built-in `list` type instead of a list instance
- Including lambda functions or method references
- Including model instances that aren't properly serialized

**Fix**: Review the code around line 152 in `chat/views.py` where `conv_history` is constructed:

```python
# Check this section for any non-serializable objects
conv_history = []
for msg in conversation.messages.all():
    # Make sure you're appending serializable dict objects
    conv_history.append({
        "role": msg.role,
        "content": msg.content,
        # Don't append functions, lambdas, or model instances
    })
```

**Debug Steps**:
1. Add print statement before `generate_chat_response` call:
   ```python
   import json
   print("[v0] conv_history:", json.dumps(conv_history, default=str))
   ```
2. Check if any values fail to serialize
3. Convert non-serializable objects to strings or remove them

## How to Deploy Fixes

### Backend Fixes
```bash
cd ~/tools/ai_invoicing

# Edit the serializers.py file
nano chat/serializers.py
# Remove the "related_batch" line and save

# Edit the views.py file
nano chat/views.py
# Fix line 152 area to ensure conv_history only contains serializable objects

# Rebuild and restart backend
docker compose down
docker compose up --build -d

# Check logs
docker compose logs -f invoicing-app
```

### Frontend Status
✅ Already fixed - no action needed

The frontend uses `apiFetch()` which:
- Automatically includes `accessToken` from React context
- Properly handles FormData for file uploads
- Includes Bearer token in Authorization header
- Works with all endpoints (`/api/chat/...`, `/api/auth/...`, etc.)

## Testing After Fixes

1. **Test Chat Endpoint**:
```bash
curl -X GET https://invoicing.dimeconsultants.africa/api/chat/conversations/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **Test in Frontend**:
   - Open https://kuehne.dimeconsultants.africa
   - Login with test credentials
   - Send a message in chat
   - Should work without "Unauthorized" errors

3. **Check Backend Logs**:
```bash
docker compose logs -f invoicing-app
# Should show successful requests, not "Unauthorized" or "not JSON serializable"
```

## Files to Edit

| File | Action | Issue |
|------|--------|-------|
| `~/tools/ai_invoicing/chat/serializers.py` | Remove `"related_batch"` line | Bug 1 |
| `~/tools/ai_invoicing/chat/views.py` | Fix line 152 `conv_history` | Bug 2 |
| `/vercel/share/v0-project/components/pages/chat-page.tsx` | ✅ Already fixed | Bug 3 |

---
**Priority**: High - These bugs block chat functionality
**Effort**: Low - Simple fixes
**Impact**: Chat endpoints will work properly with auth and serialization
