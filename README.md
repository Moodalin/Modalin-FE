# Modalin Frontend

Modalin's web application helps Indonesian textile artisans turn confirmed product demand into accountable pre-order campaigns and gives customers a transparent path from discovery to delivery.

## Overview

The frontend provides:

- Public campaign, creator, and FAQ experiences with campaign product options
- Email/password and Google authentication through Modalin Backend
- Artisan onboarding and profile management
- Artisan campaign creation with product, story, cost, target, and production inputs
- Product pre-order checkout and hosted payment redirection
- Customer order history, payment continuation, and delivery status
- Artisan dashboards for funding, orders, production milestones, and expenses

The browser never talks directly to payment, storage, email, or database providers. Authenticated requests use credentialed cookies and are sent through Modalin Backend.

## Technology Stack

| Area | Technology |
| --- | --- |
| Framework | React 19, Vite 8, TypeScript |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 and the Modalin UI system |
| Authentication | Better Auth React client |
| API Client | Fetch with credentialed cookies, abort signals, and request timeouts |
| Rich Text | Tiptap |
| Motion | Motion for React |
| Icons | Lucide React |
| Linting | Oxlint |

## Features

- **Public discovery** — Landing, creator information, FAQ, campaign collection, and campaign detail pages.
- **Authentication** — Registration, login, session restoration, protected routes, and role-aware artisan routes.
- **Artisan onboarding** — Artisan-group details, profile image, and group banner management.
- **Campaign builder** — Structured campaign, product, motif story, finance, capacity, and timeline inputs.
- **Checkout** — Product and variant selection, shipping details, order persistence, and hosted payment redirection.
- **Order history** — Persisted customer orders, payment continuation, review states, shipping progress, and tracking numbers.
- **Artisan dashboard** — Campaign performance, incoming orders, funding progress, production status, and cost records.
- **Production tracking** — Milestone updates and expense recording.
- **Responsive UI** — Mobile-first layouts, keyboard-accessible controls, route focus management, and reduced-motion support.

## Routes

| Path | Access | Description |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/for-creator` | Public | Information for artisans |
| `/faq` | Public | Frequently asked questions |
| `/login` | Public | Account login |
| `/register` | Public | Account registration |
| `/campaigns` | Public | Campaign collection |
| `/campaigns/:campaignId` | Public | Public campaign detail |
| `/onboarding` | Authenticated | Artisan-group onboarding |
| `/profile` | Authenticated | Profile and artisan-group settings |
| `/orders` | Authenticated | Customer order history |
| `/checkout` | Authenticated | Product pre-order checkout |
| `/campaigns/new` | Artisan | Campaign creation |
| `/dashboard` | Artisan | Campaign and production dashboard |

## Environment Variables

Create `.env` from `.env.example`:

```env
VITE_API_URL=http://localhost:4000
```

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of Modalin Backend. Defaults to `http://localhost:4000` when omitted. |

`VITE_API_URL` is public browser configuration. Payment keys, database credentials, SMTP credentials, and storage credentials belong only in Modalin Backend.

## Getting Started

### Prerequisites

- Node.js and npm
- Modalin Backend running and reachable through `VITE_API_URL`

### Installation

```bash
npm ci
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

### Quality Checks

```bash
npm run lint
npm run build
```

## Project Structure

```text
src/
|-- api/              # Backend API functions grouped by domain
|-- assets/           # Textile imagery and bundled visual assets
|-- components/       # Shared campaign, dashboard, layout, and UI components
|-- config/           # API client, authentication, formatting, and error mapping
|-- constants/        # API paths, navigation, statuses, and theme values
|-- hooks/            # Authentication and domain data hooks
|-- pages/            # Route-level screens
|-- types/            # Shared TypeScript contracts
|-- App.tsx           # Lazy-loaded routes and access guards
|-- index.css         # Tailwind theme and global styles
`-- main.tsx          # React entry point
```

## Backend Contract

Modalin Frontend depends on Modalin Backend for authentication, profile, campaign, order, dashboard, and production APIs. The browser follows backend-issued payment URLs without owning provider credentials or payment confirmation. Keep both repositories' request and response contracts synchronized.
