# eBridge Demo

### Interactive 3D Presentation with Real-Time Audience Voting

eBridge Demo is an interactive, 3D presentation experience that combines real-time audience voting with dynamic visual feedback. Built with React, Three.js, and Socket.IO, the application translates live voting activity into animated 3D metrics, consensus indicators, and game-mode winner highlights.

Developed as a technical demonstration of interactive frontend development, real-time communication, and state-driven 3D visualization, the project showcases skills relevant to technical support, software troubleshooting, and application development.

> **Project status:** In development · Not currently hosted  
> **Demo video:** *Coming soon*

---

## 🎥 Project Demo

**Watch the demonstration:** [Add demo video link here]

The video will showcase:
- Interactive 3D presentation controls.
- Real-time voting and live metric updates.
- Consensus detection and visual feedback.
- Game-mode winner detection and lighting changes.

*Replace the placeholder above with a link to the recorded demonstration when available.*

---

## ✨ Key Features

### Real-Time Voting
- Accepts audience votes through a Socket.IO connection.
- Tracks vote counts and calculates voting percentages.
- Broadcasts updated voting information to connected clients.
- Supports active-voter tracking and consensus detection.

### Interactive 3D Visualization
- Renders an interactive 3D environment using Three.js and React Three Fiber.
- Animates metric bars according to live voting percentages.
- Blends neutral and color-specific materials to represent voting activity.
- Highlights consensus through changes in emissive intensity.
- Updates system lighting to reflect the winning color in game mode.

### Game Mode
- Evaluates voting activity against a winner threshold.
- Announces a winner through real-time socket events.
- Connects winner state to visual feedback in the 3D scene.

### State-Driven Interface
- Uses Zustand to manage voting data and related application state.
- Connects backend events to frontend updates.
- Coordinates visual behavior with application state, camera selection, and power controls.

---

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| React / Next.js | Frontend application and component architecture |
| JavaScript | Application logic |
| Three.js | 3D rendering and material manipulation |
| React Three Fiber | React-based 3D scene integration |
| Zustand | Frontend state management |
| Node.js | Backend runtime |
| Express | HTTP server framework |
| Socket.IO | Real-time, event-driven client-server communication |

---

## 🏗️ System Architecture

The application connects a real-time voting backend with a state-driven frontend and interactive 3D scene.

```text
Audience Interaction
        │
        ▼
   Frontend UI
        │
        │ Socket.IO: castVote
        ▼
 Node.js / Express
   Voting Backend
        │
        ├── Register votes
        ├── Calculate percentages
        ├── Evaluate consensus
        └── Determine game winner
        │
        ▼
 Socket.IO Room Events
        │
        ▼
 PresentationProvider
        │
        ▼
   Zustand Store
        │
        ├── Voting UI
        ├── Live Metrics
        ├── Consensus Feedback
        └── Winner-Driven Lighting
```

### Event and State Flow

1. A user selects a voting option in the frontend.
2. The frontend sends the vote to the backend through Socket.IO.
3. The backend updates its in-memory voting state and evaluates the current voting conditions.
4. The backend broadcasts updated vote information and relevant consensus or winner events.
5. The frontend receives those events and updates shared application state.
6. React components and the 3D scene respond to the updated state.

This architecture separates voting logic, real-time communication, frontend state management, and visual presentation.

---

## 📊 3D Metrics and Visual Feedback

The `LiveMetrics` component connects voting data to the 3D environment.

It reads the current voting percentages and consensus color from Zustand and updates the corresponding 3D bar meshes.

Key behaviors include:

- **Animated bar heights:** Bar heights smoothly approach their target values using interpolation.
- **Dynamic material colors:** Materials transition between a neutral gray and the color associated with each voting option.
- **Consensus highlighting:** The bar matching the consensus color receives increased emissive intensity.
- **Camera-aware visibility:** Metric opacity changes according to the selected camera view.
- **Power-state handling:** Turning the system off resets the metric bars and their emissive intensity.

In game mode, the winning color is also propagated through application state to the 3D system lighting, connecting backend game logic to a visible result.

---

## 🔌 Backend and Real-Time Communication

The backend uses Node.js, Express, and Socket.IO to coordinate voting activity.

Its responsibilities include:

- Managing Socket.IO room membership.
- Registering votes and maintaining room voting state.
- Calculating vote percentages.
- Tracking active voters for the applicable voting mode.
- Detecting consensus conditions.
- Determining a game winner when the configured threshold is reached.
- Broadcasting voting updates and relevant state-change events.
- Handling voting resets and game resets.

The reviewed implementation stores room and voting data in memory. Database-backed persistence has not been identified, so vote state should not be assumed to survive a server restart.

### Voting Cooldown

The frontend implements a one-second cooldown to limit rapid repeated voting interactions.

A separate backend rate-limiter utility also defines a per-socket voting interval, but it has not been connected to the vote handler in the code reviewed. Consequently, server-side enforcement of that rate limit is not currently claimed.

---

## 🛠️ Technical Skills Demonstrated

This project provides practical examples of:

- **Real-time application troubleshooting:** Following events between a frontend, Socket.IO server, and connected clients.
- **State management:** Tracing how backend updates propagate through Zustand to React components.
- **Frontend debugging:** Investigating React effects, component behavior, and state synchronization.
- **3D rendering diagnostics:** Working with mesh properties, materials, emissive colors, and visual feedback.
- **Animation logic:** Using frame-based updates and interpolation to create smooth visual transitions.
- **Event-driven architecture:** Coordinating voting, consensus, game-state changes, and resets.
- **System-level reasoning:** Investigating how separate application layers interact to produce the final user experience.

These skills are relevant to technical support engineering, application troubleshooting, and diagnosing issues across interconnected software components.

---

## 🚧 Current Status and Future Improvements

The project is currently an in-development demonstration and is not publicly hosted.

Potential next steps include:

- Recording and publishing a project demonstration video.
- Deploying the frontend and backend to accessible hosting.
- Integrating and verifying server-side vote rate limiting.
- Adding automated tests for voting, consensus, and game-mode behavior.
- Evaluating persistence requirements for room and voting state.
- Improving setup documentation and deployment instructions.

---

## 💼 Project Purpose

eBridge Demo serves as a portfolio project demonstrating how real-time backend logic, frontend state management, and interactive 3D visualization can work together in a single application.

It also provides a practical way to demonstrate technical investigation and troubleshooting: understanding event flows, tracing state changes, and identifying how application logic affects visible behavior.

**The focus is not only on what the application displays, but also on understanding how its components communicate and work together.**
