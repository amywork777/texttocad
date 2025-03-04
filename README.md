# TextToCAD - AI-Powered 3D Model Generator

Convert text descriptions into 3D CAD models using AI.

## Features

- Generate 3D CAD models from text descriptions
- Interactive 3D viewer with orbit controls
- Download models as STL files
- Responsive design

## Tech Stack

- Next.js
- React Three Fiber / Three.js
- OpenAI API
- Tailwind CSS
- Shadcn/UI Components

## Deployment on Vercel

1. Push your code to GitHub
2. Create a new project on [Vercel](https://vercel.com)
3. Connect your GitHub repository
4. Set up the following environment variables in Vercel:
   - `OPENAI_API_KEY`: Your OpenAI API key

### Environment Variables

Create a `.env.local` file based on the `.env.local.example` template for local development:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
OPENAI_API_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_DEFAULT_MODEL=gpt-4o
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Troubleshooting

### Dependency Issues

If you encounter dependency conflicts during deployment, you may need to update your package versions. In particular, make sure that `date-fns` is compatible with `react-day-picker`. 