# THENIJOBS — Next.js Website

A Next.js 16 web application for THENIJOBS — a job portal, business directory, and B2B lead platform for Theni and Tamil Nadu.

<!-- Deploy Trigger for Vercel -->

## Tech Stack

- **Framework**: Next.js 16 (App Router, Static Export)
- **UI**: React 19, Radix UI, Tailwind CSS 4, Framer Motion
- **Backend**: Firebase (Firestore, Auth, Storage, Realtime Database, Cloud Functions)
- **State**: React Query (TanStack), React Context
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

### Build

```bash
npm run build
```

### Deploy

```bash
# Windows
deploy.bat

# Manual
firebase deploy --project thenijobs-9f01d
```

## Cloud Functions

Cloud Functions are located in the `functions/` directory.

```bash
cd functions
npm install
npm run build
```

## Project Structure

```
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React Context providers
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities, Firebase config, types
├── public/             # Static assets
├── functions/          # Firebase Cloud Functions
├── firestore.rules     # Firestore security rules
├── storage.rules       # Cloud Storage security rules
└── firebase.json       # Firebase hosting config
```

## License

Private — All rights reserved.
