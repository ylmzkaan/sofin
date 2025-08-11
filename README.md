# Social Finance Platform

A social finance platform where users can publish stock analyses with target prices and time horizons. Users can subscribe to analysts for a monthly fee to access premium content.

## Features

### Core Functionality
- **User Authentication**: JWT-based authentication with user registration and login
- **Stock Analysis Publishing**: Create and share stock analyses with images and text
- **Subscription System**: Monthly subscription model with Stripe integration
- **Content Access Control**: Premium content for subscribers, public content for everyone
- **Analyst Discovery**: Browse and search for analysts with success metrics
- **Success Tracking**: Track analysis success rates and performance

### Technical Features
- **Backend**: FastAPI with PostgreSQL, SQLAlchemy, and Alembic migrations
- **Frontend**: React with React Router, Tailwind CSS, and responsive design
- **Payment Processing**: Stripe integration for subscriptions
- **File Uploads**: Image upload support for analyses
- **Real-time Updates**: WebSocket support for live updates
- **Docker Deployment**: Containerized application with Docker Compose

## Project Structure

```
sofin/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── auth.py         # Authentication utilities
│   │   ├── config.py       # Configuration settings
│   │   ├── database.py     # Database configuration
│   │   └── main.py         # FastAPI application
│   ├── alembic/            # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.js          # Main application
│   ├── package.json        # Node dependencies
│   └── Dockerfile          # Frontend container
├── docker-compose.yml      # Local development setup
└── README.md              # This file
```

## Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL (if running locally)
- Redis (if running locally)

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd sofin
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/social_finance

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

### 3. Start with Docker Compose
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis on port 6379
- Backend API on port 8000
- Frontend on port 3000

### 4. Run Database Migrations
```bash
docker-compose exec backend alembic upgrade head
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development Setup

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/token` - User login
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users` - List all users with stats
- `GET /api/v1/users/{user_id}` - Get specific user profile
- `PUT /api/v1/users/me` - Update current user profile

### Analyses
- `GET /api/v1/analyses` - List all analyses
- `POST /api/v1/analyses` - Create new analysis
- `GET /api/v1/analyses/{id}` - Get specific analysis
- `PUT /api/v1/analyses/{id}` - Update analysis
- `DELETE /api/v1/analyses/{id}` - Delete analysis

### Subscriptions
- `POST /api/v1/subscriptions` - Create subscription
- `GET /api/v1/subscriptions` - List user subscriptions
- `DELETE /api/v1/subscriptions/{id}` - Cancel subscription
- `POST /api/v1/subscriptions/webhook` - Stripe webhook

## Database Schema

### Core Tables
- **users**: User accounts and profiles
- **analyses**: Stock analysis content
- **analysis_images**: Images associated with analyses
- **tags**: Analysis tags and categories
- **subscriptions**: User subscription relationships
- **payment_history**: Payment transaction records

## Deployment

### Docker Deployment
The application is containerized and ready for deployment:

```bash
# Build and run
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Kubernetes Deployment
For production deployments, use the provided Helm charts:

```bash
# Install the application
helm install social-finance ./helm/social-finance

# Upgrade the application
helm upgrade social-finance ./helm/social-finance

# Uninstall
helm uninstall social-finance
```

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Run the full test suite
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the API documentation at `/docs` endpoint

## Roadmap

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Social features (comments, likes)
- [ ] Advanced search and filtering
- [ ] Export functionality
- [ ] Multi-language support 