import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testWriting');
});

test('insert text at end', async () => {
  await page.keyboard.press('ArrowRight');
  await page.waitFor(50);
  await page.keyboard.press('h');
  await page.waitFor(50);
  await page.keyboard.press('o');
  await page.waitFor(50);
  await page.keyboard.press('j');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});

test('insert text at start then middle', async () => {
  await page.keyboard.press('b');
  await page.waitFor(50);
  await page.keyboard.press('l');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});

test('remove text', async () => {
  await page.keyboard.press('b');
  await page.waitFor(50);
  await page.keyboard.press('Backspace');
  await page.waitFor(50);
  await page.keyboard.press('ArrowRight');
  await page.waitFor(50);
  await page.keyboard.press('Backspace');
  await page.waitFor(50);
  await page.keyboard.press('b');
  await page.waitFor(50);
  await page.keyboard.press('Backspace');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});
