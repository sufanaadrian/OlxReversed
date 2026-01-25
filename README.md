A mobile marketplace app where buyers and sellers negotiate offers through offers and counter-offers, inspired by platforms like OLX and Vinted — but focused on conversation-driven deals, not fixed prices.

Built with React Native + Expo, using Supabase for backend (auth, database, realtime).

✨ Core Concept

Instead of a simple “buy now” flow, this app supports real negotiations:

Users create requests (what they want)

Other users can:

mark requests as interested

send offers

Request owners can:

accept offers directly

reject and send counter-offers

Sellers can:

accept or reject counter-offers

Once an offer or counter-offer is accepted → the request enters NEGOTIATING

Users can chat and finalize the deal

All negotiation history is preserved and visible.

📱 Features
Requests

Create detailed requests (title, description, category, budget, location)

Request lifecycle:

OPEN → collecting offers

NEGOTIATING → an offer or counter was accepted

CLOSED → deal finished (planned)

Offers & Negotiation

Send offers to requests

Reject offers with counter-offers

Accept / reject counter-offers

Full negotiation thread (tree view)

All offer rounds preserved

Latest round highlighted

Vinted-style comparison (rejected offer struck through → accepted counter shown)

My Requests

View all your requests

See offer count

Clear single status pill per request

Negotiation state shown consistently

My Offers

Track requests you’re interested in

View all offers you sent

See negotiation history per request

Chat button appears under the accepted offer or counter

Chat

Enabled once negotiation starts

Tied to a request

Preserves context of the deal

Filters & UX

Scrollable horizontal filter pills

Clear status mapping:

OPEN

NEGOTIATING

WITHDRAWN

SKIPPED

Visual cues for newest / active negotiation rounds

🧠 Status Model (Important)
Request status
DB value	UI label
active	OPEN
matched	NEGOTIATING
closed	CLOSED

A request becomes NEGOTIATING when:

an offer is accepted OR

a counter-offer is accepted

Offer logic

Original offers are never deleted

Counter-offers do not overwrite history

Accepted counters visually replace rejected offers without losing context

🛠 Tech Stack
Frontend

React Native

Expo + Expo Router

TypeScript

React Native Gesture Handler

React Native Safe Area Context

Backend

Supabase

Authentication

PostgreSQL database

Row Level Security (RLS)

🗂 Folder Structure (simplified)
app/
 ├─ (tabs)/
 │   ├─ marketplace.tsx
 │   ├─ my-requests.tsx
 │   ├─ my-offers.tsx
 │   └─ profile.tsx
 ├─ (modals)/
 │   ├─ create-request.tsx
 │   ├─ create-offer.tsx
 │   ├─ counter-offer.tsx
 │   └─ filters.tsx
 ├─ request/[id]/
 │   ├─ index.tsx
 │   └─ offers.tsx
 ├─ _layout.tsx
 └─ sign-in.tsx

🚀 Getting Started
1️⃣ Install dependencies
npm install

2️⃣ Configure environment

Create a .env file:

EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

3️⃣ Run the app
npx expo start

📌 Current Limitations / Planned Features

Deal closing flow (mark deal as completed or cancelled)

Ratings & reviews after deal completion

Push notifications (offers, counters, messages)

Offer expiration

Advanced search & sorting

Payments / escrow (future)

🧪 Project Status

This project is:

✅ fully functional negotiation marketplace MVP

🚧 actively evolving

🎯 designed to reflect real-world marketplace complexity

It’s intentionally built with clear state transitions and preserved history, rather than shortcuts.

🤝 Why this project exists

This app was built to:

explore real negotiation logic

handle non-trivial UI/UX states

model real marketplace behavior

serve as a strong portfolio project

📄 License

MIT (or add your preferred license)
