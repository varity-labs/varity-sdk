import { Router } from 'express';
import { config } from '../config';
import { resolveDomainRecord } from '../services/resolver';
import { cardHtml, cardSvg } from '../templates/card';
import { notFoundHtml } from '../templates/not-found';

export const cardRouter = Router();

/**
 * GET /card/:appName
 *
 * Serves a shareable deployment card HTML page with OG meta tags.
 * When shared on Twitter/LinkedIn, crawlers read the OG tags and
 * render a rich preview card.
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
 * GET /card/:appName/image.svg
 *
 * Serves an SVG card image (1200x630) suitable for og:image.
 * Also downloadable by developers for social media posts.
 */
cardRouter.get('/card/:appName/image.svg', async (req, res) => {
  const appName = req.params.appName.toLowerCase();
  const record = await resolveDomainRecord(appName);

  if (!record) {
    res.status(404).send('Not found');
    return;
  }

  res.type('image/svg+xml');
  res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
  res.send(cardSvg(record, config.gateway.baseDomain));
});
