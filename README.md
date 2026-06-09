# Deploy Hub Owner Dashboard

A comprehensive dashboard for managing software deployment services, built with Next.js, Chakra UI, and RTK Query.

## 🚀 Overview

Deploy Hub Owner Dashboard is a powerful web application designed for software service providers to manage deployable projects, versions, configurations, and licenses. The platform enables streamlined management of deployable software projects with versioning control and license management.

## ✨ Key Features

- **Project Management**: Create, update, and delete software projects with detailed metadata
- **Version Control**: Manage project versions with stable/latest release tagging
- **Configuration Management**: Define deployment configurations with environment variables
- **License Management**: Create and manage license offerings with pricing tiers
- **GitHub Integration**: Connect with GitHub repositories for deployment workflows
- **Deployment Provider Support**: Support for various deployment environments
- **User-friendly Dashboard**: Intuitive interface for managing all aspects of deployable software

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with App Router
- **State Management**: Redux Toolkit with RTK Query
- **UI Components**: Custom components built with Shadcn UI
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Built-in authentication system
- **Icons**: Tabler Icons & Lucide React
- **Notifications**: Sonner toast notifications

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18.0.0 or later
- npm, yarn, or pnpm package manager

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Configure environment variables:

Create a `.env.local` file in the root directory from `.env.example` and set at least:

```
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:4002
```

Firebase public keys are required for auth and push setup. `FIREBASE_CLIENT_EMAIL` and
`FIREBASE_PRIVATE_KEY` are also required for the server-side Firebase admin helper used by
the Next app routes. `OPENAI_API_KEY` is optional unless you are testing workflow generation.

4. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:4002](http://localhost:4002) in your browser.

## 🏗️ Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── auth/         # Authentication related pages
│   ├── dashboard/    # Main dashboard pages
│   │   ├── categories/    # Category management
│   │   ├── licenses/      # License management
│   │   ├── media/         # Media management
│   │   └── projects/      # Project management with versions & configs
├── common/           # Shared types, DTOs, and enums
├── components/       # Reusable UI components
├── config/           # API and service configurations
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
├── providers/        # Context providers
├── services/         # API service functions
├── store/            # Redux store and RTK Query slices
└── utils/            # Helper functions
```

## 🔑 Main Features Explained

### Projects

Manage software projects with detailed information:

- Project metadata (name, description, repository)
- Tech stack classification
- Visibility controls (public, private, featured)
- Category association

### Versions

Track and manage different versions of your projects:

- Version tagging
- Stable/latest release management
- Commit hash association
- Release notes

### Configurations

Define how projects should be built and deployed:

- GitHub account integration
- Deployment provider settings
- Environment variables management
- Complex configuration options

### Licenses

Create and manage license offerings:

- Multiple pricing tiers
- Feature listings
- Deployment limits
- Time-based expirations
- Project associations

## 🔧 Development Commands

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## 📈 Roadmap

- User role management
- Enhanced analytics
- Deployment monitoring
- CI/CD pipeline integration
- Additional deployment providers

## 📄 License

[MIT License](LICENSE)
