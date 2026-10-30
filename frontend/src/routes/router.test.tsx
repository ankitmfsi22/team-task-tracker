import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '@/test/axe';
import { renderRoute } from '@/test/render';

describe('routes', () => {
  it('renders the home page in the app shell with the API status', async () => {
    renderRoute('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(await screen.findByText('The API is up.')).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Home | Team Task Tracker'));
  });

  it('renders the 404 page, marked noindex, for an unknown path', async () => {
    renderRoute('/no-such-page');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the start' })).toHaveAttribute('href', '/');
    await waitFor(() =>
      expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, nofollow',
      ),
    );
  });

  it('has no axe violations on the home page', async () => {
    renderRoute('/');
    await screen.findByText('The API is up.');
    expect(await axeViolations()).toEqual([]);
  });

  it('has no axe violations on the 404 page', async () => {
    renderRoute('/missing');
    await screen.findByRole('heading', { name: 'Page not found' });
    expect(await axeViolations()).toEqual([]);
  });
});
