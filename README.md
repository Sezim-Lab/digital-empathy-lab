# 🧪 Digital Empathy Lab: Audio-Visual Micro-Accessibility Assistant
**An assistive Chrome extension designed to reduce cognitive overload and attention interference for Braille-educated visually impaired children with residual vision (30–40%).**

---

## 🎯 Project Mission & The Pivot
Standard screen readers (like NVDA or JAWS) are built for fully blind adults—they read entire DOM trees at high speeds, causing acute **Cognitive Overload** in children learning through tactile Braille. Conversely, simple text magnification fails because flat visual glyphs do not map onto a tactile cognitive framework.

**DigitalEmpathyExtension** bridges this gap as a *Micro-Accessibility Assistant*. It supports residual vision with high-contrast spatial framing while providing targeted auditory feedback strictly where the user points.

## ✨ Key Features
* **Pointer-Contingent Speech Synthesis:** Speaks only the hovered element via Web Speech API at an optimized `0.9` rate.
* **Motor Tremor Debounce Filter (150 ms):** Prevents overlapping audio chaos caused by hand tremors or rapid mouse movements.
* **High-Contrast Focus Framing:** Outlines active elements with a `5px` blue border and translucent yellow background using **Atkinson Hyperlegible** typography.
* **Tactile Audio Feedback:** Plays a soft acoustic click upon activating interactive links or buttons.

## 📊 Field Research Summary
Evaluated in a within-subjects A/B field study with **12 visually impaired students (ages 10–12)** at the Umit Special Boarding School:
* **Task Completion Time (TCT):** Reduced by **43.4%** (from `105.1s` to `59.5s`).
* **Misclick Rate (MR):** Dropped by **77.3%** (from `4.75` to `1.08` errors per task).
* **Perceived Cognitive Load (Adapted NASA-TLX):** Decreased from `4.5/5.0` to `2.0/5.0`.

## 🚀 How to Install Locally
1. Download or clone this repository (`Code` -> `Download ZIP`) and unzip the folder.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the unzipped folder.
