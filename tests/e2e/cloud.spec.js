// Account sign-in and cloud sync, against an in-memory fake of Supabase.
// Each test gets its own fake backend and as many "devices" (browser profiles)
// as it needs. Sign-in always "emails" the code 123456.
const { test, expect, tab, evalSafe } = require('./helpers/fixtures');

async function signIn(page, email, code = '123456') {
  await tab(page, 'settings');
  await page.fill('#authEmail', email);
  await page.click('#authSendBtn');
  await page.fill('#authCode', code);
  await page.click('#authVerifyBtn');
}
const signedIn = (page, email) => expect(page.locator('#authEmailShown')).toHaveText(email);
const state = page => evalSafe(page, () => Storage.state);

test.describe('signing in', () => {
  test('@smoke sign in with an emailed code, pick a username, and the data reaches the cloud', async ({ newDevice, fake }) => {
    const phone = await newDevice('phone');
    await phone.evaluate(() => { Storage.markRead('Genesis', 1); Storage.addFriend('Sam', 'from church'); Storage.setNotes('Exodus', 1, 'phone note'); });
    await signIn(phone, 'bo@example.com');
    await signedIn(phone, 'bo@example.com');

    await expect.poll(() => fake.cloudState('bo@example.com')).not.toBeNull();
    const cloud = fake.cloudState('bo@example.com');
    expect(cloud.progress['Genesis-1']).toBe(true);
    expect(cloud.notes['Exodus-1']).toBe('phone note');
    expect(cloud.friends).toHaveLength(1);
    await expect(phone.locator('#authStatusLine')).toContainText('Synced');

    await phone.fill('#authUsername', 'Bo_Jones');
    await phone.click('#authSaveUsernameBtn');
    await expect.poll(() => fake.profile('bo@example.com')?.username).toBe('Bo_Jones');
  });

  test('the email link sends people back to the page they started from', async ({ newDevice }) => {
    const phone = await newDevice();
    await tab(phone, 'settings');
    await phone.fill('#authEmail', 'bo@example.com');
    await phone.click('#authSendBtn');
    await expect(phone.locator('#authCode')).toBeVisible();
    expect(await phone.evaluate(() => window.__lastRedirect)).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/index\.html$/);
  });

  test('a bad email and a wrong code give friendly messages', async ({ newDevice }) => {
    const phone = await newDevice();
    await tab(phone, 'settings');
    await phone.fill('#authEmail', 'not-an-email');
    await phone.click('#authSendBtn');
    await expect(phone.locator('#accountBody')).toContainText('valid email');

    await phone.fill('#authEmail', 'bo@example.com');
    await phone.click('#authSendBtn');
    await phone.fill('#authCode', '000000');
    await phone.click('#authVerifyBtn');
    await expect(phone.locator('#accountBody')).toContainText(/didn’t work|expired/);
    await phone.click('#authBackBtn');
    await expect(phone.locator('#authEmail')).toBeVisible();
  });
});

test.describe('syncing between devices', () => {
  test('a new device receives everything from the account', async ({ newDevice }) => {
    const phone = await newDevice('phone');
    await phone.evaluate(() => { Storage.markRead('Genesis', 1); Storage.addFriend('Sam', ''); Storage.setNotes('Exodus', 1, 'phone note'); });
    await signIn(phone, 'bo@example.com'); await signedIn(phone, 'bo@example.com');
    await phone.fill('#authUsername', 'Bo_Jones'); await phone.click('#authSaveUsernameBtn');

    const laptop = await newDevice('laptop');
    await signIn(laptop, 'bo@example.com'); await signedIn(laptop, 'bo@example.com');
    await expect.poll(async () => (await state(laptop)).progress['Genesis-1']).toBe(true);
    const s = await state(laptop);
    expect(s.friends).toHaveLength(1);
    expect(s.notes['Exodus-1']).toBe('phone note');
    await expect(laptop.locator('#authUsername')).toHaveValue('Bo_Jones');
  });

  test('@smoke edits made on two devices at once are merged, not overwritten', async ({ newDevice, fake }) => {
    const phone = await newDevice('phone'), laptop = await newDevice('laptop');
    await signIn(phone, 'bo@example.com'); await signedIn(phone, 'bo@example.com');
    await signIn(laptop, 'bo@example.com'); await signedIn(laptop, 'bo@example.com');
    await expect(phone.locator('#authStatusLine')).toContainText('Synced');
    await expect(laptop.locator('#authStatusLine')).toContainText('Synced');

    await laptop.evaluate(() => Storage.markRead('Genesis', 2));
    await expect.poll(() => fake.cloudState('bo@example.com').progress['Genesis-2']).toBe(true);
    await phone.evaluate(() => Storage.markRead('Genesis', 3));             // phone has not seen Genesis 2 yet
    await expect.poll(() => Object.keys(fake.cloudState('bo@example.com').progress).sort()).toEqual(['Genesis-2', 'Genesis-3']);
    await expect.poll(async () => (await state(phone)).progress['Genesis-2']).toBe(true);
  });

  test('un-reading a chapter propagates and is not resurrected by the other device', async ({ newDevice, fake }) => {
    const phone = await newDevice('phone'), laptop = await newDevice('laptop');
    await phone.evaluate(() => Storage.markRead('Genesis', 1));
    await signIn(phone, 'bo@example.com'); await signedIn(phone, 'bo@example.com');
    await signIn(laptop, 'bo@example.com'); await signedIn(laptop, 'bo@example.com');
    await expect.poll(async () => (await state(laptop)).progress['Genesis-1']).toBe(true);

    await phone.evaluate(() => Storage.markRead('Genesis', 1));             // toggles it OFF
    await expect.poll(() => fake.cloudState('bo@example.com').progress['Genesis-1']).toBeUndefined();
    await laptop.evaluate(() => Cloud.sync());
    await expect.poll(async () => (await state(laptop)).progress['Genesis-1']).toBeUndefined();
  });

  test('changes made offline are kept and sync once the connection returns', async ({ newDevice, fake }) => {
    const phone = await newDevice('phone');
    await signIn(phone, 'bo@example.com'); await signedIn(phone, 'bo@example.com');
    await expect(phone.locator('#authStatusLine')).toContainText('Synced');

    fake.offline = true;
    await phone.evaluate(() => Storage.markRead('Leviticus', 1));
    await expect(phone.locator('#authStatusLine')).toContainText('Offline', { timeout: 15_000 });
    expect((await state(phone)).progress['Leviticus-1']).toBe(true);        // safe locally
    expect(fake.cloudState('bo@example.com').progress['Leviticus-1']).toBeUndefined();

    fake.offline = false;
    await phone.evaluate(() => Cloud.sync());
    await expect.poll(() => fake.cloudState('bo@example.com').progress['Leviticus-1']).toBe(true);
  });
});

test.describe('usernames and accounts', () => {
  test('usernames are validated and unique regardless of capitalisation', async ({ newDevice, fake }) => {
    const a = await newDevice('a'), b = await newDevice('b');
    await signIn(a, 'bo@example.com'); await signedIn(a, 'bo@example.com');
    await a.fill('#authUsername', 'ab'); await a.click('#authSaveUsernameBtn');
    await expect(a.locator('#accountBody')).toContainText('3');
    expect(fake.profile('bo@example.com')).toBeNull();
    await a.fill('#authUsername', 'Bo_Jones'); await a.click('#authSaveUsernameBtn');
    await expect.poll(() => fake.profile('bo@example.com')?.username).toBe('Bo_Jones');

    await signIn(b, 'ann@example.com'); await signedIn(b, 'ann@example.com');
    await b.fill('#authUsername', 'bo_jones'); await b.click('#authSaveUsernameBtn');
    await expect(b.locator('#accountBody')).toContainText('taken');
    expect(fake.profile('ann@example.com')).toBeNull();
  });

  test('different accounts never see each other’s data', async ({ newDevice }) => {
    const a = await newDevice('a'), b = await newDevice('b');
    await a.evaluate(() => { Storage.markRead('Genesis', 1); Storage.addFriend('Sam', ''); });
    await signIn(a, 'bo@example.com'); await signedIn(a, 'bo@example.com');
    await signIn(b, 'ann@example.com'); await signedIn(b, 'ann@example.com');
    await expect(b.locator('#authStatusLine')).toContainText('Synced');
    const s = await state(b);
    expect(Object.keys(s.progress)).toHaveLength(0);
    expect(s.friends).toHaveLength(0);
  });

  test('an account never inherits another account’s leftover data on a shared device', async ({ newDevice, fake }) => {
    const dev = await newDevice('shared');
    await signIn(dev, 'bo@example.com'); await signedIn(dev, 'bo@example.com');
    await dev.evaluate(() => Storage.markRead('Leviticus', 1));
    await expect.poll(() => fake.cloudState('bo@example.com').progress['Leviticus-1']).toBe(true);

    fake.registerUser('ann2@example.com');                                   // someone else's session appears on this device
    await dev.evaluate(() => localStorage.setItem('fake-supabase-session', JSON.stringify({ user: { id: 'uid-ann2', email: 'ann2@example.com' } })));
    await dev.reload();
    await expect.poll(async () => (await state(dev)).progress['Leviticus-1']).toBeUndefined();
    expect(fake.cloudState('ann2@example.com')?.progress?.['Leviticus-1']).toBeUndefined();
  });
});

test.describe('leaving and clearing', () => {
  test('sign out removes the data from this device; signing back in restores it', async ({ newDevice }) => {
    const phone = await newDevice('phone');
    await phone.evaluate(() => { Storage.markRead('Genesis', 2); Storage.addFriend('Sam', ''); });
    await signIn(phone, 'bo@example.com'); await signedIn(phone, 'bo@example.com');
    await expect(phone.locator('#authStatusLine')).toContainText('Synced');

    await phone.click('#authSignOutBtn');
    await phone.waitForLoadState('load');
    await expect.poll(async () => Object.keys((await state(phone)).progress).length).toBe(0);
    if (await phone.locator('#versionModal').isVisible()) await phone.locator('#versionModalGrid .version-btn').first().click();
    await tab(phone, 'settings');
    await expect(phone.locator('#authEmail')).toBeVisible();

    await signIn(phone, 'bo@example.com'); await signedIn(phone, 'bo@example.com');
    await expect.poll(async () => (await state(phone)).progress['Genesis-2']).toBe(true);
    expect((await state(phone)).friends).toHaveLength(1);
  });

  test('reset while signed in also clears the account copy (it is not silently restored)', async ({ newDevice, fake }) => {
    const phone = await newDevice('phone');
    await phone.evaluate(() => { Storage.markRead('Genesis', 1); Storage.addFriend('Sam', ''); });
    await signIn(phone, 'bo@example.com'); await signedIn(phone, 'bo@example.com');
    await expect.poll(() => fake.cloudState('bo@example.com')?.progress?.['Genesis-1']).toBe(true);

    await phone.click('#resetProgressBtn');
    await phone.waitForLoadState('load');
    await expect.poll(async () => Object.keys((await state(phone)).progress).length).toBe(0);
    await expect.poll(() => Object.keys(fake.cloudState('bo@example.com')?.progress || {}).length, { timeout: 15_000 }).toBe(0);
    expect(fake.cloudState('bo@example.com').friends || []).toHaveLength(0);
  });

  test('delete my account removes the login, profile and data', async ({ newDevice, fake }) => {
    const phone = await newDevice('phone');
    await phone.evaluate(() => Storage.markRead('Genesis', 1));
    await signIn(phone, 'bo@example.com'); await signedIn(phone, 'bo@example.com');
    await phone.fill('#authUsername', 'Bo_Jones'); await phone.click('#authSaveUsernameBtn');
    await expect.poll(() => fake.profile('bo@example.com')?.username).toBe('Bo_Jones');

    await phone.click('#authDeleteBtn');
    await expect.poll(() => fake.hasAccount('bo@example.com')).toBe(false);
    expect(fake.cloudState('bo@example.com')).toBeNull();
    expect(fake.profile('bo@example.com')).toBeNull();
  });
});
