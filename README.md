# Secure & Scalable Payment Withdrawal Module

A demo Wallet & Withdrawal Management System built with Node.js, Express, MongoDB, and EJS.
It demonstrates secure financial transaction handling including wallet balance management, withdrawals, transaction logs, concurrency handling, and secure API design.

## Architecture Overview

### Core Components

1. **API Layer** (Express.js)
   - RESTful endpoints for withdrawal operations
   - Request validation and sanitization
   - Rate limiting and security headers

2. **Service Layer**
   - Business logic encapsulation
   - Wallet management
   - Withdrawal processing
   - Transaction logging

3. **Repository Layer**
   - Database abstraction
   - Transaction management
   - Optimistic concurrency control

4. **Queue System** (Bull/Redis)
   - Asynchronous processing
   - Retry mechanisms
   - Load distribution

5. **Database** (MongoDB)
   - ACID transactions
   - Optimistic locking
   - Comprehensive indexing

## Key Features

### 1. Concurrency Handling
- **MongoDB Transactions**: Ensure atomic operations across multiple collections
- **Optimistic Locking**: Version-based concurrency control on wallets
- **Queue-based Processing**: Prevent system overload during high traffic
- **Idempotency Keys**: Prevent duplicate processing of identical requests

### 2. Security Measures

#### Input Validation & Sanitization
- Joi schema validation for all inputs
- MongoDB injection prevention
- Mass assignment protection
- Content type validation

#### Authentication & Authorization
- User status verification
- validation before withdrawals
- IP whitelisting for admin endpoints

#### Data Protection
- Encryption of sensitive data
- Secure state transitions
- Immutable transaction logs

### 3. Data Integrity

#### Wallet Management
- Never negative balance (database-level constraint)
- Daily withdrawal limits
- Real-time balance updates
- Audit trail for all changes

#### Transaction Logging
- Immutable, insert-only logs
- Before/after balance tracking
- Full audit capability
- 90-day retention policy

### 4. Scalability

#### Horizontal Scaling
- Stateless API design
- Shared Redis for queue management
- MongoDB replica sets for reads

#### Background Processing
- Bull queue for async operations
- Configurable concurrency
- Exponential backoff for retries

## Database Design

### Collections

1. **users**
   - User profile and status
   - Indexes on email, status

2. **wallets**
   - Current balance with versioning
   - Daily withdrawal tracking
   - Compound indexes for queries

3. **withdrawals**
   - Complete withdrawal lifecycle
   - Idempotency key support
   - Retry mechanism tracking

4. **transaction_logs**
   - Immutable audit trail
   - Capped collection for performance
   - TTL index for auto-cleanup

## Setup Instructions

### Prerequisites
- Node.js 18+ (LTS)
- MongoDB 6.0+ (with replica set for transactions)
- Redis 7+

# Environment Variables

Create a `.env` file in the root directory.

```
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/payment_system

# Redis Configuration
REDIS_URL=
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_USERNAME=default

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
ENCRYPTION_KEY=your-32-character-encryption-key
IDEMPOTENCY_KEY_TTL=86400

# Queue Configuration
WITHDRAWAL_QUEUE_NAME=withdrawal_processing
MAX_CONCURRENT_JOBS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

# Installation

Clone the repository:

```bash
git clone https://github.com/navjot1995/payment-withdrawal-system.git
cd payment-withdrawal-system
```

Install dependencies:

```bash
pnpm install
```

---

# Running the Project

## Development Mode

```
pnpm run dev
```

## Build

```
pnpm build
```

## Production Mode

```
pnpm start
```

Server will start at:

```
http://localhost:3000
```

---


# Key Concepts Demonstrated

## Idempotency

Prevents duplicate withdrawals when the same request is sent multiple times.

## Queue-based Processing

Withdrawal requests are processed asynchronously using Redis queues.

## Concurrency Safety

Ensures multiple withdrawal requests cannot corrupt wallet balances.

## Financial Transaction Integrity

Uses atomic operations to guarantee accurate wallet updates.

---

# Example Withdrawal Flow

1. User submits a withdrawal request
2. System validates wallet balance
3. Idempotency key is verified
4. Withdrawal job is pushed to Redis queue
5. Worker processes the withdrawal
6. Transaction is logged
7. Wallet balance is updated

---

# Demo test 

Add user and credit some amount their wallet
```
http://localhost:3000/user.html

```

Demo Payment 
```
http://localhost:3000/withdraw-funds.html

```

Check user transcation history
```
http://localhost:3000/user-transcation-history.html

````

---


# License

MIT License


