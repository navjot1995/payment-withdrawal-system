Project Structure
src/
 ├── modules
 │    ├── user
 │    ├── wallet
 │    ├── withdrawal
 │    └── transaction-log
 │
 ├── jobs
 │    └── withdrawal.processor.js
 │
 ├── config
 │    ├── database.js
 │    └── redis.js
 ├── public
 │    ├── user.html
 │    ├── withdraw-funds.html
 │    └── user-transcation-history.html
 ├── middlewares
 │    └── error.middleware.js
 │
 ├── utils
 │    └── logger.js
 │
 └── app.js