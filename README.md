<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1TRBj8X0671kWPYl6LgkQb_Y7hiD3eANY

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Assets

`public/assets/` holds everything the site renders: talk slides, the LILO
metrics screenshot, the hackathon demo, and the two slide PDFs.

One file is not in the repo — drop your own copy in before deploying:

- `public/assets/max-portrait.jpeg` — the portrait used on the home hero and
  the Life sidebar.
