# Legal Document Automation Platform

AI-powered legal document generation for California family law attorneys. Generate court-ready documents in minutes, not hours.

## 🚀 Features

- **5 Document Types**: Divorce petitions, custody agreements, property settlements, child support, and spousal support orders
- **Multi-AI Support**: OpenAI, Claude, and Gemini with automatic fallback
- **Smart Forms**: 4-step wizard with validation and auto-save
- **Court-Ready Output**: Properly formatted DOCX files with legal citations
- **Secure Storage**: Documents stored in Supabase with organization-level isolation
- **Role-Based Access**: Organization owners, admins, and members

## 📋 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **AI**: OpenAI, Anthropic Claude, Google Gemini
- **Document Generation**: docx library

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- At least one AI provider API key (OpenAI, Claude, or Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd legal-doc-automation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # AI Provider (choose: openai, claude, gemini, or test)
   AI_PROVIDER=openai

   # API Keys (at least one required)
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_AI_KEY=...
   ```

4. **Set up Supabase database**

   Run the SQL in your Supabase SQL Editor:
   ```bash
   # File: insert-templates-CORRECT.sql
   # File: create-table-structure.sql (if needed)
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   ```
   http://localhost:3000
   ```

## 📚 Documentation

- **CLAUDE.md** - Project instructions and architecture
- **FINAL-SETUP-INSTRUCTIONS.md** - Detailed setup guide
- **insert-templates-CORRECT.sql** - Database templates
- **create-table-structure.sql** - Table schema updates

## 🎯 Quick Start

1. Sign up for an account
2. Navigate to Documents → New Document
3. Select a template (e.g., Divorce Petition)
4. Fill out the form
5. Click "Generate Document"
6. Download your DOCX file

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Organization-level data isolation
- Secure authentication with Supabase Auth
- API keys stored server-side only
- Input validation on client and server

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

## 🧪 Testing

```bash
# Run in test mode (no AI API required)
# Set in .env.local:
AI_PROVIDER=test

# Then test document generation
npm run dev
```

## 📄 Available Document Templates

1. **Divorce Petition** (FL-100) - Petition for Dissolution of Marriage
2. **Custody Agreement** (FL-311) - Child Custody and Visitation
3. **Property Settlement** - Marital Property Division
4. **Child Support Order** (FL-150) - Guideline Child Support
5. **Spousal Support Order** (FL-157) - Spousal Support with FC §4320 factors

## 🛣️ Roadmap

- [ ] Additional California family law templates
- [ ] Document editing and regeneration
- [ ] E-signature integration
- [ ] Client portal
- [ ] Billing and subscriptions
- [ ] Team collaboration features
- [ ] Court filing integration

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss changes.

## 📝 License

[Your License Here]

## 🆘 Support

For issues or questions:
- Check documentation in `/docs`
- Open an issue on GitHub
- Contact: [your-email]

## ⚖️ Legal Disclaimer

This software generates legal documents for informational purposes only and does not constitute legal advice. Users should consult with a licensed attorney before filing any documents with the court.

---

Built with ❤️ for California family law attorneys
