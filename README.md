# Banca Transilvania Statement Parser

A web application for parsing Banca Transilvania bank statements (Visa Business Electron) and displaying transaction data in an interactive table.

## Features

- Upload PDF statements from Banca Transilvania 
- Parse transactions automatically
- View all transactions in a filterable, sortable table
- See total debits, credits, and balance
- Export data to CSV
- Copy data to clipboard
- Dark mode support

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Table**: @tanstack/react-table
- **Backend**: Vercel Python Serverless Functions
- **PDF Processing**: pdfplumber

## Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/bt-statement-parser.git
cd bt-statement-parser
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

This project is configured for easy deployment with Vercel:

```bash
vercel --prod
```

## Environment Setup

No specific environment variables are required, as the app runs without a database and processes data client-side or in serverless functions.

## Parser Details

The parser handles BT statement PDFs with the following strategy:

1. Extract text with pdfplumber
2. Split into transaction blocks by date patterns
3. Extract transaction details (date, description, amount, etc.)
4. Classify as debit or credit based on keywords
5. Calculate totals and normalize data

## Testing

Run tests with:

```bash
python -m unittest discover tests
```

## License

MIT

## Privacy

All data is processed in your browser or in temporary serverless functions. No data is stored persistently on any server. 