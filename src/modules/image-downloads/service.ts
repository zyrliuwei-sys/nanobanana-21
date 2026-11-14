import { and, eq, gt, isNotNull, isNull, or } from 'drizzle-orm';

import { db } from '@/core/db';
import { hotelPreview, order } from '@/config/db/schema';

/** A real, successful purchase unlocks trial originals; signup/admin-granted credits do not. */
export async function hasPaidImageDownloads(userId: string): Promise<boolean> {
  const [purchase] = await db()
    .select({ id: order.id })
    .from(order)
    .where(
      and(
        eq(order.userId, userId),
        eq(order.status, 'paid'),
        isNull(order.deletedAt),
        isNotNull(order.paidAt),
        or(
          gt(order.paymentAmount, 0),
          and(isNull(order.paymentAmount), gt(order.amount, 0))
        )
      )
    )
    .limit(1);
  return !!purchase;
}

/** Claim an anonymous preview once, after purchase, without allowing an account switch to steal it. */
export async function claimImagePreview(
  id: string,
  userId: string,
  deviceId: string
): Promise<boolean> {
  await db()
    .update(hotelPreview)
    .set({ userId })
    .where(
      and(
        eq(hotelPreview.id, id),
        isNull(hotelPreview.userId),
        eq(hotelPreview.deviceId, deviceId)
      )
    );
  const [owned] = await db()
    .select({ id: hotelPreview.id })
    .from(hotelPreview)
    .where(and(eq(hotelPreview.id, id), eq(hotelPreview.userId, userId)))
    .limit(1);
  return !!owned;
}
