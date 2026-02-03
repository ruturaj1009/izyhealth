# How to Obtain Google Client ID

To enable "Sign in with Google", you need to create a project in the Google Cloud Console and generate an OAuth Client ID.

## Step 1: Create a Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown (top left) and select **New Project**.
3. Name it (e.g., "Health Amaze Auth") and click **Create**.

## Step 2: Configure OAuth Consent Screen
1. In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (unless you have a Google Workspace organization) and click **Create**.
3. **App Information**:
   - **App Name**: Health Amaze
   - **User Support Email**: Select your email.
4. **Developer Contact Information**: Enter your email.
5. Click **Save and Continue** through the remaining steps (Scopes, Test Users). 
   - *Note: For testing, you might need to add your own email to "Test Users" if the app is not published.*

## Step 3: Create Credentials
1. Navigate to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** (top bar) > **OAuth client ID**.
3. **Application Type**: Select **Web application**.
4. **Name**: `Health Amaze Web Client`.
5. **Authorized JavaScript Origins**:
   - Add: `http://localhost:3000`
   - Add: `https://x-pharma.vercel.app` (Your production URL)
6. **Authorized Redirect URIs**:
   - Add: `http://localhost:3000`
   - Add: `https://x-pharma.vercel.app`
7. Click **Create**.

## Step 4: Get Key
1. A popup will appear with your **Client ID** and **Client Secret**.
2. Copy the **Client ID** (it usually ends in `.apps.googleusercontent.com`).
3. You do **not** need the Client Secret for this frontend-only implementation (Implicit Flow / Token).

## Step 5: Configure Application
1. Open `.env.local` in your project.
2. Update the variable:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-copied-client-id-here
   ```
3. Restart your server if needed (`npm run dev`), though Next.js usually hot-reloads env vars.
