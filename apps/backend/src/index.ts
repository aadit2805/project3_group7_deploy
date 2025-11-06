<<<<<<< HEAD
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
=======
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import pool from './db';
>>>>>>> 3fa7181f5a0a6b38ad0598991e4c9abc4ece6617
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';

<<<<<<< HEAD
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();
const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Session configuration
app.use(
  session({
    // FIND SECRET KEY
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await prisma.user.upsert({
          where: { googleId: profile.id },
          update: {},
          create: {
            googleId: profile.id,
            email: profile.emails?.[0].value!,
            name: profile.displayName,
            role: 'MANAGER',
          },
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as any).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/'}),
  (req: Request, res: Response) => {
    // Successful authentication, redirect home.
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

app.get('/api/user', (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  res.json(req.user);
});

app.post('/api/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.sendStatus(200);
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Project 3 - Group 7 API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});
=======
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3001;
>>>>>>> 3fa7181f5a0a6b38ad0598991e4c9abc4ece6617

// Mount API router
app.use('/api', apiRouter);

app.post('/api/orders', async (req, res) => {
  const { order_items } = req.body;

  if (!order_items || !Array.isArray(order_items)) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderInsertQuery =
      'INSERT INTO "Order" (staff_id, datetime, price) VALUES ($1, $2, $3) RETURNING order_id';
    const orderValues = [1, new Date(), 0]; // Assuming staff_id 1 and initial price 0
    const orderResult = await client.query(orderInsertQuery, orderValues);
    const orderId = orderResult.rows[0].order_id;

    let totalPrice = 0;

    for (const item of order_items) {
      const mealPrice = item.mealType.meal_type_price;
      const entreesUpcharge = item.entrees.reduce(
        (acc: number, entree: { upcharge: number }) => acc + entree.upcharge,
        0
      );
      const sidesUpcharge = item.sides.reduce(
        (acc: number, side: { upcharge: number }) => acc + side.upcharge,
        0
      );
      totalPrice += mealPrice + entreesUpcharge + sidesUpcharge;

      const mealInsertQuery =
        'INSERT INTO Meal (order_id, meal_type_id) VALUES ($1, $2) RETURNING meal_id';
      const mealValues = [orderId, item.mealType.meal_type_id];
      const mealResult = await client.query(mealInsertQuery, mealValues);
      const mealId = mealResult.rows[0].meal_id;

      for (const entree of item.entrees) {
        const detailInsertQuery =
          'INSERT INTO Meal_Detail (meal_id, meal_type_id, menu_item_id, role) VALUES ($1, $2, $3, $4)';
        const detailValues = [mealId, item.mealType.meal_type_id, entree.menu_item_id, 'entree'];
        await client.query(detailInsertQuery, detailValues);
      }

      for (const side of item.sides) {
        const detailInsertQuery =
          'INSERT INTO Meal_Detail (meal_id, meal_type_id, menu_item_id, role) VALUES ($1, $2, $3, $4)';
        const detailValues = [mealId, item.mealType.meal_type_id, side.menu_item_id, 'side'];
        await client.query(detailInsertQuery, detailValues);
      }
    }

    const updateOrderPriceQuery = 'UPDATE "Order" SET price = $1 WHERE order_id = $2';
    await client.query(updateOrderPriceQuery, [totalPrice, orderId]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Order submitted successfully', orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error submitting order:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.get('/api/meal-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM meal_types WHERE meal_type_id = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Meal type not found' });
    }
  } catch (err) {
    console.error('Error fetching meal type by ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/meal-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meal_types');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/menu-items', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM menu_items';
    const params = [];
    if (type) {
      query += ' WHERE item_type = $1';
      params.push(type as string);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
