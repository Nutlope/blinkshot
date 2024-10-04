<a href="https://www.blinkshot.io">
  <img alt="Blinkshot" src="./public/og-image.png">
  <h1 align="center">BlinkShot</h1>
</a>

<p align="center">
  An open source real-time AI image generator. Powered by Flux through Together.ai.
</p>

## Tech stack

- [Flux Schnell](https://www.dub.sh/together-flux/) from BFL for the image model
- [Together AI](https://www.dub.sh/together-ai) for inference
- Next.js app router with Tailwind
- Helicone for observability
- Plausible for website analytics

## Cloning & running

1. Clone the repo: `git clone https://github.com/Nutlope/blinkshot`
2. Create a `.env.local` file and add your [Together AI API key](https://www.dub.sh/together-ai): `TOGETHER_API_KEY=`
3. Run `npm install` and `npm run dev` to install dependencies and run locally

## Future Tasks

- [ ] Add a CTA to fork the code on GithUb
- [ ] On hover, have a download button
- [ ] Let people play around with resolutions
- [ ] Let people play around with steps
- [ ] Add a description of the app to the footer
- [ ] Add themes
