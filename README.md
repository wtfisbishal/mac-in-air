# Mac In Air 💨

Seamlessly control and monitor your Mac experience through a dedicated desktop application and a versatile web-based interface.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=flat&logo=electron&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat&logo=npm&logoColor=white)
![electron](https://img.shields.io/badge/electron-06B6D4?style=flat&logo=electron&logoColor=white)

Mac In Air provides a unique way to interact with your Mac, combining a robust desktop application with a user-friendly web frontend. It empowers users with remote input capabilities, including a virtual Mac keyboard and joystick control, all facilitated by real-time communication.

This project is designed for those seeking an extended control interface for their Mac, whether for remote operation, unique input methods, or simply a novel interaction experience. By leveraging Electron for the desktop client and Next.js for the web UI, Mac In Air delivers a responsive and integrated solution.

## Table of Contents

- [Features](#features)
- [Tech Stack / Tools & Technologies](#tech-stack--tools--technologies)
- [Installation](#installation)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [Available Commands / Scripts](#available-commands--scripts)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Features ✨

*   **Real-time Connectivity:** Utilizes Socket.IO for seamless, low-latency communication between the client and server.
*   **Interactive Mac Keyboard:** Features a simulated Mac keyboard interface for remote text input and command execution.
*   **Joystick/Nipple Control:** Integrates joystick-like control (`nipplejs`) for intuitive remote navigation or interaction.
*   **Live Status Indicators:** Provides clear visual feedback on connection and application status through dynamic badges.
*   **Cross-Platform Desktop Application:** Packaged as an Electron application for native desktop experience across various operating systems.
*   **Modern Web Interface:** A responsive and interactive web frontend built with Next.js and React.

## Tech Stack / Tools & Technologies 🛠️

This project leverages a modern and robust set of technologies:

*   **Languages:**
    *   `TypeScript`
    *   `JavaScript`
*   **Frontend Frameworks:**
    *   `React`
    *   `Next.js`
*   **Desktop Application:**
    *   `Electron` (for packaging, inferred from `electron-builder` configuration)
*   **Real-time Communication:**
    *   `Socket.IO Client webRTC`
*   **State Management:**
    *   `TanStack React Query` 

## Installation 🚀

Follow these steps to set up and run the Mac In Air project locally.

### Prerequisites

*   `Node.js` (LTS version recommended)
*   `npm` (Node Package Manager)

### Clone the Repository

```bash
git clone https://github.com/bisxxal/mac-in-air.git
cd mac-in-air
```

### Install Dependencies

The project consists of two main parts: a desktop application (`desktop`) and a web frontend (`web/frontend`). You need to install dependencies for both.

```bash
# Install dependencies for the desktop application
cd desktop
npm install

# Install dependencies for the web frontend
cd ../web/frontend
npm install
```

### Set up Environment Variables 🔑

Both the desktop application and the web frontend may require environment variables. A `.env` file is used for the desktop application.

1.  Create a `.env` file in the `desktop/` directory.
2.  **TODO:** Add necessary environment variables to `.env` as required by the application. (e.g., API keys, server URLs, etc.)

## Usage 💻

### Running the Web Frontend

To start the Next.js web application in development mode:

```bash
cd web/frontend
npm run dev
```

The web application will typically be accessible at `http://localhost:3001`.

### Running the Desktop Application

**TODO:** Instructions for running the desktop application in development or building it for production are not explicitly available in the provided snippets. Typically, Electron applications use `npm start` for development and `npm run build` or similar for packaging. Please refer to the `desktop/package.json` for specific scripts once available.

## Folder Structure 📂

The project is organized into two main workspaces: `desktop` for the Electron application and `web/frontend` for the Next.js web application.

```
.
├── desktop/                    # The Electron desktop application
│   ├── src/                    # Source code for the Electron app
│   │   └── components/         # Reusable React components (e.g., StatusBadge.tsx)
│   └── package.json            # Electron app dependencies and build configurations
└── web/
    └── frontend/               # The Next.js web application
        ├── public/             # Static assets (images, fonts, etc.)
        ├── src/                # Source code for the Next.js app
        │   ├── app/            # Next.js App Router pages and layouts
        │   └── components/     # Reusable React components
        └── package.json        # Web app dependencies and scripts
```

## Available Commands / Scripts ⚙️

The following scripts are available for the `web/frontend` application:

| Command           | Description                                       |
| :---------------- | :------------------------------------------------ |
| `npm run dev`     | Starts the Next.js development server on port 3001. |
| `npm run build`   | Builds the Next.js application for production.    |
| `npm run start`   | Starts the Next.js production server.             |
| `npm run lint`    | Runs ESLint to check for code quality issues.     |

**TODO:** Commands for the `desktop` application are not explicitly listed in the provided `package.json` snippet.

## Configuration & Environment Variables 🔑

The `desktop` application uses an `.env` file for environment-specific configurations.

*   `.env`: Located in the `desktop/` directory.

**TODO:** List specific environment variables (e.g., `SOCKET_SERVER_URL`, `API_KEY`) and their descriptions here once they are defined in the project.

## Contributing 👋

We welcome contributions to Mac In Air! If you're interested in improving the project, please follow these guidelines:

1.  **Fork the repository.**
2.  **Clone your forked repository** to your local machine.
3.  **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-feature-name` or `git checkout -b bugfix/issue-description`.
4.  **Make your changes** and ensure they adhere to the project's coding style (if any).
5.  **Test your changes** thoroughly.
6.  **Commit your changes** with a clear and concise message: `git commit -m "feat: Add new feature"`.
7.  **Push your branch** to your forked repository.
8.  **Open a Pull Request** to the `main` branch of the original `bisxxal/mac-in-air` repository, describing your changes in detail.

 