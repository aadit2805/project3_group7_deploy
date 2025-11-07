import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRouter from './routes/api';
import pool from './db';

dotenv.config();

// Initialize
const app: Express = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Session setup
app.use(
  session({
    secret: process.env.AUTH_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
  })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth setup
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.AUTH_URL}/auth/google/callback`,
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
            role: 'MANAGER', // default for now
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

// --- AUTH ROUTES ---

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: Request, res: Response) => {
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

app.get('/api/user', (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  res.json(req.user);
});

app.post('/api/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

// --- OTHER API ROUTES ---

app.use('/api', apiRouter);

// Example order creation endpoint (unchanged from yours)
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
    const orderValues = [1, new Date(), 0];
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

// --- HEALTH ROUTE ---
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
