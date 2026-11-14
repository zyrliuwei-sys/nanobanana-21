import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, beforeEach, test } from 'node:test';
import { sql } from 'drizzle-orm';

const directory = await mkdtemp(join(tmpdir(), 'image-original-tests-'));
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_URL: `file:${directory}/test.db`,
  AUTH_SECRET: 'isolated-image-test-only',
});
const { db } = await import('../src/core/db');
const { hasPaidImageDownloads, claimImagePreview } =
  await import('../src/modules/image-downloads/service');
const { createImagePreview, sealImageOriginal, openImageOriginal } =
  await import('../src/lib/image-original');
const { freeView, ownsFreeTask } =
  await import('../src/routes/api/image/-free');
const { PhotonImage } = await import('@cf-wasm/photon');

await db().run(
  sql`create table "order" (id text primary key, user_id text, status text, amount integer, payment_amount integer, paid_at integer, deleted_at integer)`
);
await db().run(
  sql`create table hotel_preview (id text primary key, user_id text, device_id text)`
);
beforeEach(async () => {
  await db().run(sql`delete from "order"`);
  await db().run(sql`delete from hotel_preview`);
});
after(async () => {
  await rm(directory, { recursive: true, force: true });
});

test('only an actual paid, positive-value, non-deleted purchase unlocks originals', async () => {
  assert.equal(await hasPaidImageDownloads('buyer'), false);
  await db().run(
    sql`insert into "order" values ('payment', 'buyer', 'created', 990, 990, null, null)`
  );
  assert.equal(await hasPaidImageDownloads('buyer'), false);
  await db().run(
    sql`update "order" set status='paid', paid_at=123, payment_amount=0`
  );
  assert.equal(await hasPaidImageDownloads('buyer'), false);
  await db().run(sql`update "order" set payment_amount=990`);
  assert.equal(await hasPaidImageDownloads('buyer'), true);
  assert.equal(await hasPaidImageDownloads('stranger'), false);
  await db().run(sql`update "order" set deleted_at=456`);
  assert.equal(await hasPaidImageDownloads('buyer'), false);
  await db().run(sql`update "order" set deleted_at=null, status='failed'`);
  assert.equal(await hasPaidImageDownloads('buyer'), false);
});

test('an anonymous preview can only be claimed once, by its device, and stays bound to that account', async () => {
  await db().run(
    sql`insert into hotel_preview values ('preview', null, 'device')`
  );
  assert.equal(
    await claimImagePreview('preview', 'thief', 'other-device'),
    false
  );
  const claims = await Promise.all([
    claimImagePreview('preview', 'first', 'device'),
    claimImagePreview('preview', 'second', 'device'),
  ]);
  assert.equal(claims.filter(Boolean).length, 1);
  const winner = claims[0] ? 'first' : 'second';
  assert.equal(
    await claimImagePreview('preview', winner, 'other-device'),
    true
  );
  assert.equal(
    await claimImagePreview(
      'preview',
      winner === 'first' ? 'second' : 'first',
      'device'
    ),
    false
  );
});

test('a free task exposes an owned preview route and never its original storage or provider URL', () => {
  const row = {
    id: 'preview-123456789',
    userId: null,
    deviceId: 'device',
    ipHash: 'ip',
    status: 'success',
    size: '1:1',
    quality: 'anon',
    requestId: 'provider-secret',
    taskId: 'model',
    error: null,
    sceneImageUrl: 'https://storage.example/original.png',
    createdAt: new Date(),
  };
  const view = freeView(row);
  assert.equal(view.imageUrl, '/api/image/preview?id=preview-123456789');
  assert.ok(!JSON.stringify(view).includes('storage.example'));
  assert.ok(!JSON.stringify(view).includes('provider-secret'));
  assert.equal(
    ownsFreeTask(
      row,
      { deviceId: 'device', ipHash: '', newDevice: false },
      null
    ),
    true
  );
  const claimed = { ...row, userId: 'buyer' };
  assert.equal(
    ownsFreeTask(
      claimed,
      { deviceId: 'device', ipHash: '', newDevice: false },
      'stranger'
    ),
    false
  );
  assert.equal(
    ownsFreeTask(
      claimed,
      { deviceId: 'other', ipHash: '', newDevice: false },
      'buyer'
    ),
    true
  );
});

test('previews are separately encoded and reduced, while encrypted originals restore identical bytes', async () => {
  const bytes = new Uint8Array(
    await readFile(
      new URL('../public/imgs/showcase/product.jpg', import.meta.url)
    )
  );
  const preview = await createImagePreview(bytes);
  const sourceImage = PhotonImage.new_from_byteslice(bytes);
  const previewImage = PhotonImage.new_from_byteslice(preview);
  try {
    assert.ok(
      Math.max(previewImage.get_width(), previewImage.get_height()) <= 512
    );
    assert.ok(previewImage.get_width() < sourceImage.get_width());
    assert.ok(previewImage.get_height() < sourceImage.get_height());
    assert.notDeepEqual(preview, bytes);
  } finally {
    sourceImage.free();
    previewImage.free();
  }
  const sealed = await sealImageOriginal(bytes, 'image-one', 'test-key');
  assert.notDeepEqual(sealed, bytes);
  assert.deepEqual(
    await openImageOriginal(sealed, 'image-one', 'test-key'),
    bytes
  );
  await assert.rejects(openImageOriginal(sealed, 'image-two', 'test-key'));
  await assert.rejects(openImageOriginal(sealed, 'image-one', 'different-key'));
  const tampered = sealed.slice();
  tampered[tampered.length - 1] ^= 1;
  await assert.rejects(openImageOriginal(tampered, 'image-one', 'test-key'));
});
