<p align="center">
  <img src="./frontend/src/assets/youtuBro_logo_with_text.png" alt="YoutuBro Logo" width="400">
</p>

# YoutuBro

YoutuBro is an intelligent, AI-powered assistant designed to streamline your YouTube experience. It allows users to create, manage, and interact with playlists and videos using natural language commands through a conversational interface. By integrating directly with a user's YouTube account, it provides a seamless and personalized media management and playback environment.

## Key Features

* **AI-Powered Chat Interface**: Control all application features using natural language prompts.
* **Dynamic Playlist Creation**: Automatically generate playlists, including complex, topic-based roadmaps, from simple text commands.
* **Seamless Playlist Management**: Add, remove, rename, and delete playlists and their contents through the chat interface.
* **Intelligent Playback**: Play specific videos or entire playlists, manage the "Up Next" queue with drag-and-drop, and shuffle playback.
* **Secure Authentication**: Uses Google OAuth 2.0 to securely connect to a user's YouTube account.

## Tech Stack

### Frontend (Deployed on Vercel)

* **Framework**: React (with Vite)
* **Styling**: Tailwind CSS
* **Routing**: React Router
* **API Communication**: Axios
* **Media**: YouTube Iframe Player API

### Backend (Deployed on Render)

* **Runtime**: Node.js
* **Framework**: Express.js
* **Language Models**: Google Gemini / OpenRouter (DeepSeek)
* **Database**: Supabase (PostgreSQL) for user token storage
* **Caching**: Redis (hosted on Upstash)
* **Authentication**: Google OAuth 2.0, JSON Web Tokens (JWT)
* **APIs**: YouTube Data API v3

## Architecture

The application is built on a decoupled architecture with a static frontend and a stateless backend API.
1.  The **React frontend** handles all user interface elements and client-side state management.
2.  The **Node.js/Express backend** serves as the core logic engine. It authenticates users, securely stores tokens, and interfaces with all external APIs.
3.  An **AI-driven command pipeline** classifies the user's intent, extracts relevant parameters, and synthesizes the necessary actions or search queries.
4.  **Redis** is used as a caching layer to reduce latency and minimize YouTube API quota usage for frequently accessed data like playlists.

## Getting Started

### Prerequisites

* Node.js and npm
* A Google Cloud Platform project with the YouTube Data API v3 enabled and OAuth 2.0 credentials (Client ID, Client Secret).
* A Supabase project for the PostgreSQL database.
* A Redis instance (e.g., from Upstash).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file and populate it with your API keys and database credentials (e.g., `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `SUPABASE_URL`, `REDIS_URL`, etc.).
    ```bash
    npm start
    ```

3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    ```
    Create a `.env` file and add `VITE_API_URL=http://localhost:3000`.
    ```bash
    npm run dev
    ```
