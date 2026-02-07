# Retreat Calculator

A comprehensive cost-splitting calculator designed for retreats, group trips, and shared accommodations. Built with React, TypeScript, and Vite.

## Features

- **Dynamic Cost Calculation**: Automatically splits costs based on participant occupancy per night
- **Participant Management**: Add participants with flexible arrival and departure dates
- **Additional Modules**: Handle loans, services, and multiple tips between participants
- **Database Integration**: Persistent storage using Upstash Redis KV
- **Multi-Currency Support**: EUR/USD with real-time conversion
- **Data Import/Export**: CSV functionality for easy data management
- **Responsive Design**: Mobile-friendly interface with collapsible sections

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: CSS Modules with responsive design
- **Database**: Upstash Redis (serverless KV store)
- **Deployment**: Vercel-ready configuration
- **Charts**: Recharts for data visualization

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
git clone https://github.com/kischiman/retreat-calculator.git
cd retreat-calculator
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_UPSTASH_REDIS_REST_URL`: Your Upstash Redis REST URL
   - `VITE_UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis REST token

**Important**: Add these as regular environment variables (not secrets) in your Vercel project settings under Environment Variables.

The project includes a `vercel.json` configuration for optimal deployment.

### Environment Variables

Create a `.env.local` file for development:

```env
VITE_UPSTASH_REDIS_REST_URL=your_redis_url
VITE_UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## Usage

1. **Setup**: Configure booking dates and total cost
2. **Add Participants**: Enter names and stay duration
3. **Additional Modules**: Add loans, services, or tips between participants
4. **Review Results**: View detailed cost breakdown per person
5. **Export**: Download results as CSV for record-keeping

## Architecture

- **Components**: Modular React components with TypeScript
- **State Management**: React hooks for local state
- **Database**: Upstash Redis for persistent storage
- **Calculations**: Dynamic cost splitting algorithms
- **UI/UX**: Collapsible sections, responsive design

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details
