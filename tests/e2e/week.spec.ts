import { expect, test, type Page } from '@playwright/test';
import { completeFirstRun } from './helpers.ts';

async function fillSession(
  page: Page,
  group: string,
  values: { start?: string; duration?: string; pace?: string; rpe?: string },
) {
  const box = page.getByRole('group', { name: group });
  if (values.start) await box.getByLabel('Start').fill(values.start);
  if (values.duration)
    await box.getByLabel('Duration (min)').fill(values.duration);
  if (values.pace)
    await box.getByLabel('Expected pace (min:sec per km)').fill(values.pace);
  if (values.rpe) await box.getByLabel('Effort, RPE 1 to 10').fill(values.rpe);
}

test('first run with the standard week fills the current week', async ({
  page,
}) => {
  await completeFirstRun(page, {
    ftpW: '250',
    week: async (p) => {
      await p
        .getByRole('button', { name: 'Start from my standard week' })
        .click();
      await p
        .getByRole('group', { name: 'Morning circuit (15 min) on' })
        .getByLabel('Tuesday')
        .check();
      // Saving with TODO values left empty is blocked.
      await p.getByRole('button', { name: 'Next' }).click();
      await expect(p.getByRole('alert')).toHaveText(
        'Fix the highlighted fields to continue.',
      );

      await fillSession(p, 'Monday Run intervals', {
        start: '18:30',
        duration: '60',
        pace: '5:00',
      });
      await fillSession(p, 'Tuesday Pilates', {
        start: '08:00',
        duration: '50',
        rpe: '4',
      });
      await fillSession(
        p,
        'Tuesday Morning circuit (push-ups, glute bridges, reverse lunges, towel curls, hollow holds)',
        {
          start: '07:00',
          rpe: '5',
        },
      );
      await fillSession(p, 'Wednesday Sweet spot, trainer', {
        start: '18:00',
        duration: '60',
      });
      await fillSession(p, 'Thursday Hard club ride', {
        start: '18:30',
        duration: '90',
      });
      await fillSession(p, 'Friday Easy Z2', {
        start: '12:00',
        duration: '60',
      });
      await fillSession(p, 'Saturday Optional Z2', {
        start: '10:00',
        duration: '90',
      });
      await fillSession(p, 'Sunday Long ride', { start: '09:30' });
      // The live preview uses the profile being set up (FTP 250 W).
      await expect(
        p
          .getByRole('group', { name: 'Wednesday Sweet spot, trainer' })
          .getByTestId('kcal-preview'),
      ).toHaveText('About 807 kcal');
      await p.getByRole('button', { name: 'Next' }).click();
    },
  });

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Week' })
    .click();
  const rows = page.getByRole('listitem');
  await expect(rows.filter({ hasText: 'Monday' })).toContainText(
    'Run intervals',
  );
  await expect(rows.filter({ hasText: 'Tuesday' })).toContainText(
    '07:00 Morning circuit',
  );
  await expect(rows.filter({ hasText: 'Sunday' })).toContainText(
    'Long ride · 240 min',
  );
  await expect(rows.filter({ hasText: 'Sunday' })).toContainText(
    '10 g/kg carbohydrate',
  );
});

test('the session editor previews energy and updates the week', async ({
  page,
}) => {
  await completeFirstRun(page);
  await page.goto('sessions/new?date=2030-01-07');
  await page.getByLabel('Start').fill('18:00');
  await page.getByLabel('Duration (min)').fill('60');
  // No FTP: Z2 is easy effort, 01015, 4.3 MET: (4.3 - 1) * 75 * 1 = 247.5
  await expect(page.getByTestId('kcal-preview')).toHaveText('About 248 kcal');
  await expect(page.getByText('No FTP or planned kJ')).toBeVisible();
  // Z4 is vigorous, 01017, 9.0 MET: (9.0 - 1) * 75 * 1 = 600
  await page.getByLabel('Zone').selectOption('Z4');
  await expect(page.getByTestId('kcal-preview')).toHaveText('About 600 kcal');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/week\/2030-01-07$/);
  await expect(
    page.getByRole('link', { name: /18:00 Ride · 60 min · Z4 threshold/ }),
  ).toBeVisible();

  await page.goto('week?date=2030-01-07');
  const monday = page.getByTestId('day-2030-01-07');
  const before = await monday.textContent();
  await monday.click();
  await page.getByRole('link', { name: /18:00 Ride/ }).click();
  await page.getByLabel('Duration (min)').fill('90');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/week\/2030-01-07$/);
  await page.goto('week?date=2030-01-07');
  await expect(page.getByTestId('day-2030-01-07')).toContainText('90 min');
  expect(await page.getByTestId('day-2030-01-07').textContent()).not.toBe(
    before,
  );
});

test('a template applies to an empty week', async ({ page }) => {
  await completeFirstRun(page);
  await page.goto('templates/new');
  await page.getByLabel('Template name').fill('Easy week');
  await page.getByRole('button', { name: 'Add session' }).click();
  await page.getByLabel('Day', { exact: true }).selectOption('3');
  await page.getByLabel('Start').fill('12:00');
  await page.getByLabel('Duration (min)').fill('45');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/templates$/);
  await expect(page.getByText('Easy week')).toBeVisible();

  await page.goto('week?date=2030-01-14');
  await page.getByRole('button', { name: 'Apply template' }).click();
  await expect(page.getByRole('status')).toHaveText('Template applied.');
  await expect(page.getByTestId('day-2030-01-16')).toContainText(
    '12:00 Ride · 45 min',
  );
});
