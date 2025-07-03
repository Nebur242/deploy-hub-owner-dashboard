# Session Expiration Fix

## Problem

The application was experiencing session expiration after approximately 5 minutes, which was causing users to be logged out unexpectedly.

## Root Cause

The issue was related to Firebase Authentication's `DEFAULT_ID_TOKEN_MAX_AGE` constant, which is set to 5 minutes (300 seconds). This constant affects:

1. **ID Token Age Validation**: Firebase checks the age of ID tokens when creating session cookies
2. **Session Cookie Creation**: If an ID token is older than 5 minutes, Firebase may reject session cookie creation
3. **Automatic Invalidation**: Existing sessions may become invalid due to the underlying token expiration

## Solution Implementation

### 1. Enhanced Session Creation API (`/api/auth/session`)

- **Token Age Validation**: Added server-side validation to check if ID tokens are older than 4 minutes
- **Proactive Handling**: Returns a conflict response (409) with a custom token when the ID token is too old
- **Better Error Handling**: Improved error messages and status codes for different failure scenarios

### 2. Improved Auth Service (`src/services/auth-service.ts`)

- **Reduced Cache Buffer**: Changed token refresh buffer from 5 minutes to 2 minutes
- **Force Refresh**: Always force token refresh to ensure fresh tokens for session creation
- **Smart Session Creation**: New `createSession()` method that handles token refresh scenarios automatically
- **Retry Logic**: Automatically retries session creation with fresh tokens when needed

### 3. Proactive Session Management (`src/components/session-manager.tsx`)

- **Background Refresh**: Automatically refreshes sessions every 4 minutes
- **Prevention Strategy**: Stays ahead of the 5-minute Firebase limitation
- **State-Aware**: Only runs when user is logged in
- **Error Handling**: Graceful handling of refresh failures

### 4. Updated Redux Actions

- **Login/Register**: Both now use the improved `authService.createSession()` method
- **Better Error Handling**: Enhanced error reporting for session creation failures

## Key Changes

### Token Management

```typescript
// Before: 5-minute buffer, occasional stale tokens
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000;

// After: 2-minute buffer, always fresh tokens
const TOKEN_REFRESH_BUFFER = 2 * 60 * 1000;
// Always force refresh for session creation
const token = await getIdToken(currentUser, true);
```

### Session API Enhancement

```typescript
// Check token age before creating session
const tokenAge = now - decodedToken.iat;
if (tokenAge > 240) {
  // 4 minutes
  // Return custom token for client refresh
  const customToken = await auth().createCustomToken(decodedToken.uid);
  return NextResponse.json(
    {
      error: "Token too old",
      customToken,
      code: "TOKEN_REFRESH_REQUIRED",
    },
    { status: 409 }
  );
}
```

### Proactive Session Refresh

```typescript
// Refresh every 4 minutes to stay ahead of 5-minute limit
setInterval(refreshSession, 4 * 60 * 1000);
```

## Benefits

1. **Consistent Sessions**: Users no longer experience unexpected logouts
2. **Proactive Management**: Sessions are refreshed before expiration
3. **Better UX**: Seamless experience without authentication interruptions
4. **Error Recovery**: Automatic retry logic for transient failures
5. **Monitoring**: Better logging for debugging session issues

## Testing

To verify the fix is working:

1. **Login and Wait**: Log in and wait for 4+ minutes to see proactive refresh
2. **Check Console**: Look for "Proactively refreshing session..." messages
3. **Long Sessions**: Test sessions lasting longer than 5 minutes
4. **Page Refresh**: Verify sessions persist across page refreshes after 5+ minutes

## Monitoring

Watch for these console messages:

- `"Proactively refreshing session..."` - Normal operation
- `"Session refreshed successfully"` - Successful refresh
- `"Token refresh required, attempting to refresh..."` - Recovery in action
- `"Session refresh failed:"` - Investigate if this appears frequently

## Configuration

The following constants can be adjusted if needed:

```typescript
// In auth-service.ts
const TOKEN_REFRESH_BUFFER = 2 * 60 * 1000; // 2 minutes

// In session-manager.tsx
const REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes

// In session/route.ts
const TOKEN_AGE_LIMIT = 240; // 4 minutes in seconds
```

## Future Improvements

1. **Exponential Backoff**: Add retry delays for failed session refreshes
2. **User Notification**: Optionally notify users of session refresh activities
3. **Metrics**: Add telemetry for session refresh success/failure rates
4. **Configuration**: Make refresh intervals configurable via environment variables
