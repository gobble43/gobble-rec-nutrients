const express = require('express');
const app = express();

// Load environment variables
const dotenv = require('dotenv');
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: './env/development.env' });
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: './env/production.env' });
}

// Initial Configuration, Static Assets, & View Engine Configuration
require('./config/middleware.js')(app, express);

// Routes
require('./config/routes.js')(app);

app.listen(Number(process.env.PORT), process.env.HOST, () => {
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`${process.env.APP_NAME} is listening on port ${process.env.PORT}`);
});
