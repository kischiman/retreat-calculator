# Retreat Calculator

A comprehensive cost-splitting calculator designed for retreats, group trips, and shared accommodations. Built with React, TypeScript, and Vite.

## Features

- **Dynamic Cost Calculation**: Automatically splits costs based on participant occupancy per night
- **Participant Management**: Add participants with flexible arrival and departure dates
- **Additional Modules**: Handle loans, services, and multiple tips between participants
- **Multi-Currency Support**: EUR/USD with real-time conversion
- **Data Import/Export**: CSV functionality for easy data management
- **Responsive Design**: Mobile-friendly interface with collapsible sections

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: CSS Modules with responsive design
- **Charts**: Recharts for data visualization
- **Deployment**: Static site deployment ready

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

### Static Site Deployment

This is a standard React/Vite application that can be deployed to any static hosting service:

- **Vercel**: Connect your GitHub repository to Vercel
- **Netlify**: Drag and drop the `dist` folder after running `npm run build`
- **GitHub Pages**: Use GitHub Actions to build and deploy
- **AWS S3**: Upload the `dist` folder to an S3 bucket with static hosting

No environment variables or database setup required.

## Usage

1. **Setup**: Configure booking dates and total cost
2. **Add Participants**: Enter names and stay duration
3. **Additional Modules**: Add loans, services, or tips between participants
4. **Review Results**: View detailed cost breakdown per person
5. **Export**: Download results as CSV for record-keeping

## Architecture

- **Components**: Modular React components with TypeScript
- **State Management**: React hooks for local state
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
