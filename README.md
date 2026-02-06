<!-- PROJECT LOGO -->
<p align="center">
  <a href="https://github.com/calcom/cal.com">
   <img src="./public/readme-image.png" alt="Logo">
  </a>

  <h3 align="center">Link</h3>

  <p align="center">
    The professional, open-source Link-in-Bio platform built for creators who value design and performance.
    <br />
    <a href="https://https://link.kreeasi.web.id/"><strong>Learn more »</strong></a>
    <br />
    <br />
    <a href="https://github.com/fadilsflow/link/discussions">Discussions</a>
    ·
    <a href="https://https://link.kreeasi.web.id/">Website</a>
    ·
    <a href="https://github.com/fadilsflow/link/issues">Issues</a>
  </p>
</p>

## **Your digital identity, unified.**

> The professional, open-source Link-in-Bio platform built for creators who value design and performance.

| 🚧  | **Project Under Active Development**<br>Link is currently in **Beta**. Features and schemas may change before v1.0. |
| :-- | :------------------------------------------------------------------------------------------------------------------ |

</p>

## Why Link?

Most link-in-bio tools are restrictive and expensive. **Link** gives you the freedom to build a mini-website that truly represents your brand.

- **🔓 Open Source & Self-Hostable**: You own your data. Host it yourself for free, forever.
- **🎨 Pixel-Perfect Control**: Customize profiles with wallpapers, custom fonts, and granular styling options.
- **⚡ Blazing Fast**: Powered by **TanStack Start** and **React 19** for instant page loads.
- **🛡️ Type-Safety**: End-to-end type safety with tRPC and Drizzle ORM.
- **🧱 Block-Based Builder**: Go beyond simple buttons. Add text, headers, and rich media blocks.

> **Our Vision**: Link is designed to be a sustainable open-source project. While the core software is free to self-host, we are working on a managed **Cloud Version** (with a free tier and premium features) for those who prefer a hassle-free experience.

## Tech Stack

Built with the bleeding edge of the React ecosystem:

- **Framework**: [TanStack Start](https://tanstack.com/router/latest) (React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) & [Base UI](https://base-ui.com)
- **Database**: [Drizzle ORM](https://orm.drizzle.team) & [Neon](https://neon.tech)
- **API**: [tRPC](https://trpc.io)
- **Auth**: [Better Auth](https://www.better-auth.com)
- **State**: [TanStack Query](https://tanstack.com/query/latest)
- **Storage**: Cloudflare R2 (S3 Compatible)
- **Email**: [Resend](https://resend.com)

---

## Getting Started

Follow these steps to get your own instance running locally.

### Prerequisites

- [Bun](https://bun.sh) (v1.0 or later)
- PostgreSQL database
- Cloudflare R2 Bucket
- Resend API Key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/link.git
   cd link
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory and add your credentials:

   ```bash
   # Database (Neon/Postgres)
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

   # Auth (Better Auth & Google)
   BETTER_AUTH_SECRET="your_generated_secret"
   BETTER_AUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."

   # Storage (Cloudflare R2)
   R2_ACCOUNT_ID="..."
   R2_ACCESS_KEY_ID="..."
   R2_SECRET_ACCESS_KEY="..."
   R2_BUCKET_NAME="..."
   R2_PUBLIC_URL="https://pub-..."

   # Email (Resend)
   RESEND_API_KEY="re_..."
   ```

4. **Initialize Database**
   Push the schema to your database.

   ```bash
   bun run db:push
   ```

5. **Start Development Server**

   ```bash
   bun run dev
   ```

   Visit `http://localhost:3000` to see your app in action.

## Commands

| Command             | Description                          |
| :------------------ | :----------------------------------- |
| `bun run dev`       | Start the development server         |
| `bun run build`     | Build the application for production |
| `bun run db:push`   | Push schema changes to the database  |
| `bun run db:studio` | Open Drizzle Studio to manage data   |
| `bun run lint`      | Run ESLint                           |

## Contributing

Contributions are welcome! This project is open-source and we value community feedback. Please read our [Contributing Guide](CONTRIBUTING.md) (coming soon) to get started.

## License

[MIT](LICENSE) © 2026 Link
