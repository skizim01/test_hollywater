# NestJS GraphQL Book Catalog

A fully functional NestJS project with GraphQL configured for a book catalog system.

## Boilerplate Template

This project is based on the [NestJS GraphQL Boilerplate](https://github.com/dmytroPolhul/nestjs-boilerplate) template by Dmytro Polhul, which provides a production-ready foundation for building scalable GraphQL APIs with NestJS, TypeORM, and PostgreSQL.

## Project Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- Redis
- Docker (optional, for containerized setup)

### Installation

1. Clone the repository

```bash
git clone https://github.com/skizim01/test_hollywater
cd test_hollywater
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables
   Create a `.env` file in the root directory:

```env
# Application Configuration
PORT=8000
BASE_HOST=0.0.0.0
NODE_ENV=development

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=3333
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE_IN=6000
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRE_IN=604800

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
PRODUCTION_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Database Setup

#### Option 1: Using Docker (Recommended)

```bash
# Start PostgreSQL database and Redis
docker-compose up -d database redis

# Wait for services to be ready, then run migrations
npm run mr
```

#### Option 2: Local PostgreSQL and Redis

1. Install PostgreSQL and Redis locally
2. Create a database named `postgres`
3. Update the `.env` file with your local database and Redis credentials
4. Run migrations:

```bash
npm run mr
```

## Running the Seed Script

The project includes a comprehensive seed script that populates the database with:

- **8+ Authors** with realistic biographical information
- **1000+ Books** across different genres (Fiction, Non-Fiction, Science, History)
- **1 Default User** for testing and administration
- **Realistic relationships** between books and authors

### Default User Credentials

The seed script creates a default admin user:

- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: `Moderator`
- **Status**: `Active`

### To run the seed script:

```bash
npm run seed
```

## Running the Application

### Development Mode

```bash
npm run start:dev
```

The GraphQL playground will be available at: `http://localhost:8000/graphql`

## Rate Limiting

The application implements comprehensive rate limiting using Redis to protect against abuse:

### Rate Limit Features

- **Operation-specific limits** - Different limits for different GraphQL operations
- **User-based limiting** - Authenticated users get separate rate limits
- **IP-based fallback** - Anonymous users limited by IP address
- **Redis-backed storage** - Distributed rate limiting across multiple instances
- **Automatic cleanup** - Expired rate limit data is automatically removed

### Rate Limit Configuration

- **searchBooks**: 30 requests per minute
- **books/authors**: 60 requests per minute
- **statistics**: 10 requests per minute
- **login**: 5 attempts per 15 minutes

### 🚨 Rate Limiting Security Improvements Needed

The current rate limiting implementation has a **critical security vulnerability** that needs to be addressed:

#### Current Problem

```typescript
// Current problematic error handling
} catch (error) {
  this.logger.error(`Rate limit check failed for key: ${key}`, error);
  return {
    allowed: true, // ⚠️ DANGEROUS: Allows all requests on Redis errors
    remaining: config.maxRequests - 1,
    resetTime: Date.now() + config.windowMs,
    totalHits: 1,
  };
}
```

#### Security Risks

- **Fail-Open Strategy**: When Redis fails, rate limiting is completely disabled
- **DDoS Vulnerability**: Attackers can exploit Redis failures to bypass rate limits
- **No Error Classification**: All errors are handled the same way
- **No Fallback Mechanism**: No local cache or alternative protection

## Caching

The application uses Redis for caching search results to improve performance:

### Cache Features

- **Automatic caching** of searchBooks query results
- **5-minute TTL** by default for cached results
- **Cache invalidation** capabilities
- **Cache statistics** and monitoring
- **Cache warming** for popular searches

## GraphQL API

### Main Search Query - searchBooks

The main feature is the `searchBooks` query that supports complex searching with text search and filters.

#### Basic Search by Text

```graphql
query {
  searchBooks(searchInput: { query: "Harry Potter" }) {
    books {
      id
      title
      genre
      publicationYear
      author {
        id
        name
        bio
      }
    }
    total
    page
    limit
  }
}
```

#### Search with Genre Filter

```graphql
query {
  searchBooks(
    searchInput: { query: "adventure", filters: { genre: FICTION } }
  ) {
    books {
      id
      title
      genre
      publicationYear
      author {
        name
      }
    }
    total
  }
}
```

#### Search with Publication Year Range

```graphql
query {
  searchBooks(
    searchInput: { filters: { publicationYear: { from: 2020, to: 2024 } } }
  ) {
    books {
      id
      title
      genre
      publicationYear
      author {
        name
      }
    }
    total
  }
}
```

#### Complex Search with Multiple Filters

```graphql
query {
  searchBooks(
    searchInput: {
      query: "science"
      filters: { genre: SCIENCE, publicationYear: { from: 2020 } }
    }
    page: 1
    limit: 10
  ) {
    books {
      id
      title
      genre
      publicationYear
      author {
        id
        name
        bio
      }
    }
    total
    page
    limit
  }
}
```

### Other Available Queries

#### Get All Books with Pagination

```graphql
query {
  books(page: 1, limit: 20) {
    books {
      id
      title
      genre
      publicationYear
      author {
        name
      }
    }
    total
    page
    limit
  }
}
```

#### Get Book by ID

```graphql
query {
  book(id: 1) {
    id
    title
    genre
    publicationYear
    author {
      id
      name
      bio
    }
  }
}
```

#### Get Books by Author

```graphql
query {
  booksByAuthor(authorId: 1) {
    id
    title
    genre
    publicationYear
  }
}
```

#### Get Books by Genre

```graphql
query {
  booksByGenre(genre: FICTION) {
    id
    title
    publicationYear
    author {
      name
    }
  }
}
```

#### Get Book Statistics

```graphql
query {
  bookStatistics
}
```

#### Get All Authors

```graphql
query {
  authors {
    id
    name
    bio
    books {
      id
      title
      genre
    }
  }
}
```

#### Search Authors by Name

```graphql
query {
  searchAuthors(name: "Rowling") {
    id
    name
    bio
    books {
      id
      title
    }
  }
}
```

#### Get Author Statistics

```graphql
query {
  authorStatistics
}
```

### User Management (Existing)

#### Get All Users

```graphql
query {
  users {
    id
    firstName
    lastName
    email
    role
    status
  }
}
```

#### Get User by ID

```graphql
query {
  userById(id: "user-id-here") {
    id
    firstName
    lastName
    email
    role
  }
}
```

#### Create User

```graphql
mutation {
  createUser(
    createUserInput: {
      firstName: "John"
      lastName: "Doe"
      email: "john.doe@example.com"
      password: "password123"
      role: WRITER
      status: true
    }
  ) {
    id
    firstName
    lastName
    email
    role
  }
}
```

### Authentication

#### Login

```graphql
mutation {
  login(email: "user@example.com", password: "password123")
}
```

#### Refresh Token

```graphql
mutation {
  refresh
}
```

#### Logout

```graphql
mutation {
  logout
}
```

## Database Schema

### Entities

#### User

- `id`: UUID (Primary Key)
- `firstName`: String
- `lastName`: String
- `email`: String (Unique)
- `password`: String (Hashed)
- `role`: Enum (WRITER, MODERATOR)
- `status`: Boolean
- `token`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime
- `deletedAt`: DateTime

#### Author

- `id`: Number (Primary Key)
- `name`: String
- `bio`: String (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

#### Book

- `id`: Number (Primary Key)
- `title`: String
- `genre`: Enum (FICTION, NON_FICTION, SCIENCE, HISTORY)
- `publicationYear`: Number (Optional)
- `author`: Author (Many-to-One relationship)
- `createdAt`: DateTime
- `updatedAt`: DateTime

## Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run seed` - Run database seeding script
- `npm run mr` - Run database migrations
- `npm run mre` - Revert last migration

## Project Structure

```
src/
├── common/                 # Shared utilities and decorators
├── config/                 # Configuration files
├── database/              # Database configuration and migrations
│   ├── migrations/        # TypeORM migration files
│   └── seeds/            # Database seeding scripts
├── modules/               # Feature modules
│   ├── _baseModule/      # Base module with common functionality
│   ├── auth/             # Authentication module
│   ├── user/             # User management module
│   ├── author/           # Author management module
│   └── book/             # Book management module
└── main.ts               # Application entry point
```

## Technologies Used

- **NestJS** - Progressive Node.js framework
- **GraphQL** - Query language and runtime
- **Apollo Server** - GraphQL server implementation
- **TypeORM** - Object-Relational Mapping
- **PostgreSQL** - Database
- **Redis** - Caching and rate limiting
- **JWT** - JSON Web Tokens for authentication
- **Passport** - Authentication middleware
- **bcrypt** - Password hashing
- **Docker** - Containerization

## License

MIT License
