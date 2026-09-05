# Husna Artistry

Premium e-commerce site for handmade Arabic calligraphy frames.

## Stack
- Customer UI: HTML, CSS, JavaScript
- Admin UI: HTML, CSS, JavaScript
- API: Node.js + Express
- Database: MongoDB + Mongoose
- Images: Cloudinary
- Payments: Razorpay

## Local setup

1. Install Node.js 18+.
2. Open a terminal in `server/`.
3. Copy `server/.env.example` to `server/.env`.
4. Fill in the environment values from your existing deployment/service accounts.
5. Install dependencies:

```bash
npm install
```

6. Start the API and website:

```bash
npm start
```

7. Open `http://localhost:5000`.

Admin portal:
`http://localhost:5000/admin`

## Security
- Real `.env` files are intentionally excluded from the project.
- Do not commit API secrets, database credentials, or payment secrets.
- `npm install` regenerates `package-lock.json` for the local environment.

## Notes
The customer and admin JavaScript behavior has been preserved while the visual layer was refreshed. The database remains MongoDB so existing data and backend functionality do not need a destructive migration.

## Premium motion refresh

The customer site now uses a cinematic dark editorial visual system inspired by the provided scroll-reveal reference. It includes a scroll progress rail, GSAP ScrollTrigger-driven section reveals, hero parallax, artwork stage motion, staggered product reveals, image scaling, animated drawers/modals, badge micro-interactions, and reduced-motion support.

The motion layer is in `public/motion.js`; business logic remains in the existing application scripts. GSAP is loaded from a CDN at runtime, with a native IntersectionObserver fallback if the animation library is unavailable.

Cloudinary dependencies are pinned to a peer-compatible combination (`cloudinary` 1.x + `multer-storage-cloudinary` 4.x).

