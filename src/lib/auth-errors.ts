/**
 * Maps raw Firebase Auth error codes to friendly, user-facing error messages.
 * Never expose internal codes or stack traces to commuters.
 */
export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Please check your credentials and try again.';

    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';

    case 'auth/invalid-email':
      return 'Please enter a valid email address format.';

    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';

    case 'auth/user-disabled':
      return 'This commuter account has been disabled. Please contact support.';

    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access is temporarily restricted. Please try again shortly or reset your password.';

    case 'auth/network-request-failed':
      return 'Unable to reach the server. Please check your network connection and try again.';

    case 'auth/popup-closed-by-user':
      return 'The sign-in popup was closed before completion.';

    default:
      return 'An unexpected error occurred while processing your request. Please try again.';
  }
}
