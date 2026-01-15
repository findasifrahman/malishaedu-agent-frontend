/*
Ops Dashboard Fix for Message Loading and Auto-Scroll Issues

PROBLEMS IDENTIFIED:
1. Still loads all messages instead of paginated loading
2. Auto-scrolls to bottom on every message load
3. API response structure might be incorrect

FIXES NEEDED:

1. Fix API Response Handling:
   - Current: const newMessages = response.data || []
   - Should be: const newMessages = response.data.messages || response.data.data || []

2. Fix Auto-scroll Logic:
   - Current: Scrolls to bottom on every message load
   - Should: Only scroll when user is at bottom OR for new messages

3. Fix Message Loading:
   - Current: Loads all messages repeatedly
   - Should: Load messages only once, then poll for new ones

KEY CHANGES TO MAKE in OpsDashboard.jsx:

IN loadMessages function:
- Fix API response structure handling
- Remove auto-scroll when loading more messages
- Only scroll for new messages when appropriate

IN useEffect for selectedConversation:
- Only load messages once initially
- Use polling for updates instead of constant reloading

SCROLL BEHAVIOR:
- Don't auto-scroll when loading older messages
- Only auto-scroll when new messages arrive and user is at bottom
- Maintain scroll position when loading more messages

TESTING:
1. Select conversation -> should load messages once and scroll to bottom
2. Stay at bottom -> should auto-scroll for new messages
3. Scroll up -> should NOT auto-scroll for new messages
4. Load more -> should maintain scroll position
*/
