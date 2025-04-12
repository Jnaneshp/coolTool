# BombasticTool - Next.js Dashboard with Clerk Authentication & GitHub Integration

A beautiful Next.js dashboard with Clerk authentication, GitHub repository integration, dark/light mode, and interactive UI components.

## Features

- **Authentication**: Secure user authentication with Clerk, including GitHub OAuth
- **GitHub Integration**: View all your GitHub repositories with interactive cards
- **Repository Stats**: Display stars, forks, watchers and language information
- **Modern Dashboard**: Beautiful UI with interactive components
- **Dark/Light Mode**: Theme switching capabilities
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Analytics Visualization**: Charts and statistics display
- **Settings Management**: User profile and app settings

## Tech Stack

- **Next.js 14**: React framework for production
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Clerk**: Authentication and user management with GitHub OAuth
- **Shadcn/UI**: Beautifully designed components
- **Lucide Icons**: Beautiful icon set
- **GitHub API**: Fetch and display repository data

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/yourusername/bombastictool.git
cd bombastictool
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Set up environment variables
   Create a `.env.local` file in the root directory with your Clerk keys:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home
```

4. Configure GitHub OAuth in Clerk Dashboard

   - Sign up for Clerk and create a new application
   - Go to Social Connections → GitHub → Enable
   - Set up OAuth application in GitHub with callback URL from Clerk

5. Run the development server

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## GitHub Integration

The GitHub integration allows users to:

- Connect with their GitHub account through Clerk authentication
- View all public repositories in a beautiful card layout
- See repository statistics like stars, forks, and watchers
- Track top languages used across repositories
- Access repository links with one click

Users can either link their GitHub account through Clerk's OAuth or manually enter a GitHub username to view public repositories.

## Project Structure

- **`/src/app`**: Main application pages and layouts
- **`/src/components`**: Reusable UI components
- **`/src/lib`**: Utility functions and helpers
- **`/public`**: Static assets

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/yourusername/bombastictool)

## License

MIT
