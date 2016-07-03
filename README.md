[![Build Status](https://api.travis-ci.org/gobble43/gobble-rec-nutrients.svg?branch=master)](https://travis-ci.org/gobble43/gobble-rec-nutrients)

[![Stories in Ready](https://badge.waffle.io/gobble43/gobble-rec-nutrients.png?label=ready&title=Ready)](https://waffle.io/gobble43/gobble-rec-nutrients)

# Gobble-rec-nutrients
Gobble-rec-nutrients is a microservice, which accepts a request with

- product barcode (UPC) or
- specific nutrient 

and sends back a comparison analysis of

- product specific nutrients level 
- average nutrients level of product category

and a variety of recommendations including

- a similar product with better nutrients
- a product with the highest percentage of the input nutrient 

## Table of Contents
1. [Getting started](#getting-started)
2. [Tech](#tech)
3. [Database Schema](#database-schema)
4. [Team](#team)
5. [Contributing](#contributing)

## Getting started

Clone and install dependencies:
```sh
$ git clone https://github.com/gobble43/gobble-rec-nutrients.git
$ cd gobble-rec-nutrients
$ npm install
```
Create `env/development.env` and set environment variables. Follow `env/example.env`.

```sh
$ npm start
```

#### Testing

Configure the environment variable `NODE_ENV` prior to running tests.

 ```sh
$ export NODE_ENV=development
$ npm test
```

## Tech
> Redis, Cluster, Express, Bluebird, Supertest, Mocha 

## Database Schema
> Add schema for application db here

## Directory Layout
> Use the diagram below as an example and starting point
```
├── /env/                            # Environment variables
├── /node_modules/                   # 3rd-party libraries and utilities
├── /server/                         # Server source code
│  ├── /httpServer/                
│  │   ├── /config/                  # HTTP Server configuration
│  │   │  ├── /middleware.js/        # HTTP Server middleware
│  │   │  ├── /routes.js/            # HTTP Server routes for incoming GET and POST requests
│  │   ├── /server.js/               # HTTP Server initialization
│  ├── /util/                      
│  │   ├── /helpers.js/              # Helper functions for redis
│  ├── /workers/                
│  │   ├── /categoryWorker.js/       # Category worker to collect category information
│  │   ├── /matrixWorker.js/         # Matrix worker for computation and database creation
│  │   ├── /recommendationWorker.js/ # Recommendation worker to create recommendation
│  └── /master.js                    # Server-side startup script
├── /test/                           # Server side tests
│  ├── /setup.js/                    # Tests configuration setup
│  ├── /spec.js/                     # Server side tests
└── .eslintrc                        # ESLint settings
└── .gitignore
└── .travis.yml                      # Travis CI configuration
└── LICENSE                         
└── package.json                     # List of 3rd party libraries and utilities to be installed
└── PULL_REQUEST_TEMPLATE              
└── README.md                
```

## Team
  - Product Owner:            [Leo Adelstein](https://github.com/leoadelstein)
  - Scrum Master:             [Jack Zhang](https://github.com/jackrzhang)
  - Development Team Members: [Leo Adelstein](https://github.com/leoadelstein), [Jinsoo Cha](https://github.com/jinsoocha), [Will Tang](https://github.com/willwtang/shortly-deploy), [Jack Zhang](https://github.com/jackrzhang)

## Style-guide
See [STYLE-GUIDE.md](https://github.com/gobble43/docs/blob/master/STYLE-GUIDE.md) for style-guide.

## Contributing
See [CONTRIBUTING.md](https://github.com/gobble43/docs/blob/master/STYLE-GUIDE.md) for contribution guidelines.

