# StoryForge: AI-Powered Content Editor for Creators

StoryForge is an innovative AI-powered content editor inspired by [Blinkshot](https://github.com/Nutlope/blinkshot). Our project takes the concept further, offering a comprehensive suite of tools for content creators to generate, edit, translate, and publish their work in various formats.

## Features

- **AI-Powered Content Generation**: From a single prompt, users can generate both text and contextually relevant images.
- **Multi-Language Support**: Instantly translate content into multiple languages using Together AI's Gemma-2-27b-it model.
- **Smart Translation Caching**: We implement a hashing technique to avoid re-translating unchanged content, improving efficiency.
- **Multiple View Formats**: View and edit your content as a book, magazine, comic, or slideshow.
- **Flexible Export Options**: Download your creations in various formats including DOCX, PDF, and EPUB.

## Tech Stack

- Next.js with App Router
- Tailwind CSS for styling
- Together AI for inference (using Gemma-2-27b-it for translations)
- Azure Blob Storage for image storage(to do)
- Prisma Supabase for database management(to do)

## Getting Started

1. Clone the repo:
2. Install dependencies: `npm install`
3. Set up your environment variables (see `.env.example`)
4. Run the development server: `npm run dev`

## Future Enhancements (To-Do)

- [ ] Integrate video generation and embedding in documents
- [ ] Implement speech-to-text functionality for initial prompts
- [ ] Add support for more languages and translation models
- [ ] Enhance the comic view with panel layout customization
- [ ] Implement collaborative editing features

## Acknowledgements

This project was inspired by [Blinkshot](https://github.com/Nutlope/blinkshot). We've expanded on the concept to create a comprehensive tool for content creators.

## License

[MIT License](LICENSE)
