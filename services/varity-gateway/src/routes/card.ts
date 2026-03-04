import { Router } from 'express';
import sharp from 'sharp';
import { config } from '../config';
import { resolveDomainRecord } from '../services/resolver';
import { cardHtml, cardSvg, cardSvgDev, cardSvgUser } from '../templates/card';
import { notFoundHtml } from '../templates/not-found';

export const cardRouter = Router();

/**
 * GET /card/:appName
 *
 * Serves a shareable deployment card HTML page with OG meta tags.
 * Shows both developer and user cards with share buttons.
 */
cardRouter.get('/card/:appName', async (req, res) => {
  const appName = req.params.appName.toLowerCase();
  const record = await resolveDomainRecord(appName);

  if (!record) {
    res.status(404).type('html').send(notFoundHtml);
    return;
  }

  res.type('html');
  res.set('Cache-Control', 'public, max-age=300'); // 5 min cache
  res.send(cardHtml(record, config.gateway.baseDomain));
});

/**
 * GET /card/:appName/image.png
 *
 * Default OG image (user card). Used by Twitter, LinkedIn, Discord crawlers.
 */
cardRouter.get('/card/:appName/image.png', async (req, res) => {
  const appName = req.params.appName.toLowerCase();
  const record = await resolveDomainRecord(appName);

  if (!record) {
    res.status(404).send('Not found');
    return;
  }

  try {
    const svg = cardSvg(record, config.gateway.baseDomain);
    const png = await sharp(Buffer.from(svg))
      .resize(1200, 630)
      .png()
      .toBuffer();

    res.type('image/png');
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.send(png);
  } catch (err) {
    console.error(`[card] Failed to generate PNG for ${appName}:`, err);
    res.status(500).send('Failed to generate image');
  }
});

/**
 * GET /card/:appName/image-dev.png
 *
 * Developer card — "I just shipped" editorial layout.
 * Left accent bar, app name + "is live.", deploy time.
 */
cardRouter.get('/card/:appName/image-dev.png', async (req, res) => {
  const appName = req.params.appName.toLowerCase();
  const record = await resolveDomainRecord(appName);

  if (!record) {
    res.status(404).send('Not found');
    return;
  }

  try {
    const svg = cardSvgDev(record, config.gateway.baseDomain);
    const png = await sharp(Buffer.from(svg))
      .resize(1200, 630)
      .png()
      .toBuffer();

    res.type('image/png');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(png);
  } catch (err) {
    console.error(`[card] Failed to generate dev PNG for ${appName}:`, err);
    res.status(500).send('Failed to generate image');
  }
});

/**
 * GET /card/:appName/image-user.png
 *
 * User card — centered app showcase.
 * App name, tagline, developer attribution.
 */
cardRouter.get('/card/:appName/image-user.png', async (req, res) => {
  const appName = req.params.appName.toLowerCase();
  const record = await resolveDomainRecord(appName);

  if (!record) {
    res.status(404).send('Not found');
    return;
  }

  try {
    const svg = cardSvgUser(record, config.gateway.baseDomain);
    const png = await sharp(Buffer.from(svg))
      .resize(1200, 630)
      .png()
      .toBuffer();

    res.type('image/png');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(png);
  } catch (err) {
    console.error(`[card] Failed to generate user PNG for ${appName}:`, err);
    res.status(500).send('Failed to generate image');
  }
});

/**
 * GET /card/:appName/image.svg
 *
 * Raw SVG card (user card). For developers to use in presentations, etc.
 */
cardRouter.get('/card/:appName/image.svg', async (req, res) => {
  const appName = req.params.appName.toLowerCase();
  const record = await resolveDomainRecord(appName);

  if (!record) {
    res.status(404).send('Not found');
    return;
  }

  res.type('image/svg+xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(cardSvg(record, config.gateway.baseDomain));
});
