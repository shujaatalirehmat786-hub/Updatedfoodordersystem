# Online ordering app

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/maqboolalishahs-projects/v0-online-ordering-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/l6aIWnzOUCu)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/maqboolalishahs-projects/v0-online-ordering-app](https://vercel.com/maqboolalishahs-projects/v0-online-ordering-app)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/l6aIWnzOUCu](https://v0.app/chat/l6aIWnzOUCu)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository.
## Design system

The storefront follows the SAVERA KITCHEN Figma design. Tokens live in
`app/globals.css` (`--brand` `#f54a00`, cream paper surfaces, ink `#111`), the
type pairing is Cormorant Garamond (display) + Inter (body), loaded in
`app/layout.tsx`. Design artwork used for decorative sections sits in
`public/savera/`.

### Product and store images

The backend returns uploaded media as a relative path, for example
`product.imageId.fileUrl = "store-images/<uuid>.jpg"`. The host that serves
those files is not part of the API response, so it is configured through an
environment variable:

```
NEXT_PUBLIC_MEDIA_BASE_URL=https://<your-media-host>
```

With it set, relative paths resolve to real photos everywhere (products,
categories, store logo, hero image). Without it, records that only have a
relative path fall back to a neutral monogram placeholder — deliberately not a
stock food photo, so a dish is never shown with unrelated food. Records whose
image is already an absolute URL work either way. See `lib/media.ts`.
