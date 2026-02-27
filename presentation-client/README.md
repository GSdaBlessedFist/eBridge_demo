# eBridge Demo

An interactive 3D web experience built with React Three Fiber that showcases modular UI components, animated controls, and dynamic data panels within a real-time 3D environment.

This project explores how physical metaphors (buttons, panels, drawers, screens) can be translated into interactive web interfaces using modern WebGL tooling.

---

## 🚀 Overview

eBridge Demo is a presentation-focused interactive scene designed to:

- Demonstrate 3D UI interactions inside the browser
- Showcase modular component architecture
- Explore dynamic data projection onto 3D surfaces
- Experiment with playful UX elements (hidden triggers, randomized reveals)
- Present unconventional interaction concepts for ecommerce and product storytelling

The experience blends 3D modeling workflows with real-time React-based rendering.

---

## 🧰 Tech Stack

- React
- React Three Fiber (R3F)
- Three.js
- @react-three/drei
- Blender (asset creation & animation)
- GLTF / GLB asset pipeline

Optional / In Progress:
- Colyseus (multiplayer experimentation)
- Dynamic data-driven UI systems

---

## 🧱 Architecture Philosophy

### 1. Physical UI Metaphor
Buttons, panels, drawers, and screens are modeled as physical objects in Blender and then controlled via React state and animation logic.

### 2. Separation of Concerns
- Blender handles:
  - Geometry
  - Pivots/origins
  - Naming conventions
  - Keyframe animation clips
- React Three Fiber handles:
  - State logic
  - Interaction
  - Animation triggering
  - Dynamic text projection

### 3. Data Surfaces
Translucent panels are used as projection surfaces for dynamic text elements, allowing:
- Real-time UI updates
- Interactive demo readouts
- Presentation-driven content swapping

---

## 📁 Project Structure (Conceptual)
/public
/models
demo_scene.glb

/src
/components
Scene.jsx
Module_DemoButtons.jsx
DataPanel.jsx
/hooks
/utils

---

## 🎮 Key Features

- Animated 3D buttons triggered via pointer interaction
- Keyframe animations exported from Blender and accessed in R3F
- Dynamic text overlays mapped to 3D planes
- Modular grouping using named GLTF nodes
- Experimental hidden interaction elements (randomized reveal concept)

---

## 🧠 Design Considerations

- Naming conventions in Blender match node access patterns in R3F.
- Origins/pivots are carefully placed to enable natural rotation-based interactions.
- Custom properties may be used in Blender for metadata tagging.
- Interactive elements are grouped for predictable traversal and control.

---

## 🛠 Setup

```bash
npm install
npm run dev
```
---

## 🔮 Future Exploration

- Multiplayer synchronized interactions
- Procedural animation triggers
- Data-driven ecommerce prototype mode
- UI state persistence
- Gesture-based input
- Advanced shader work for holographic panels

--- 

## 🎯 Purpose

This project is both a technical demo and a conceptual playground.
It explores how traditional web interfaces can evolve into spatial, immersive, interactive systems.

---

## 📜 License

MIT (or specify your preferred license)