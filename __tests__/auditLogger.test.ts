import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAuditEvent } from '@/lib/auditLogger';
import { computeAuditHash } from '@/lib/auditChain';
import prisma from '@/lib/prisma';

// Mock Prisma: capture the event created inside the transaction callback.
const createMock = vi.fn().mockResolvedValue({ id: 'test-event-1' });
const queryRawMock = vi.fn().mockResolvedValue([{ hash: null }]); // empty ledger

vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        $queryRaw: queryRawMock,
        auditEvent: { create: createMock },
      })
    ),
  },
}));

describe('Audit Logger (tamper-evident hash chain)', () => {
  beforeEach(() => {
    createMock.mockClear();
    queryRawMock.mockClear();
    queryRawMock.mockResolvedValue([{ hash: null }]);
  });

  it('creates an audit event chained to the previous event hash', async () => {
    const previousHash = 'a'.repeat(64);
    queryRawMock.mockResolvedValue([{ hash: previousHash }]);

    await logAuditEvent({
      action: 'TEST_ACTION',
      actorId: 'user-123',
      affectedRecordId: 'record-456',
      newValues: { test: true },
      organizationId: 'org-1',
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    const data = createMock.mock.calls[0][0].data;

    expect(data.action).toBe('TEST_ACTION');
    expect(data.actorId).toBe('user-123');
    expect(data.newValues).toBe(JSON.stringify({ test: true }));
    expect(data.organizationId).toBe('org-1');
    // Chain fields
    expect(data.previousHash).toBe(previousHash);
    expect(data.hash).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
    // The stored hash commits to this event's exact content
    expect(data.hash).toBe(
      computeAuditHash(previousHash, {
        action: 'TEST_ACTION',
        actorId: 'user-123',
        affectedRecordId: 'record-456',
        newValues: JSON.stringify({ test: true }),
        organizationId: 'org-1',
        timestamp: data.timestamp.toISOString(),
      })
    );
  });

  it('handles optional fields and a fresh ledger', async () => {
    await logAuditEvent({ action: 'SYSTEM_ACTION' });

    const data = createMock.mock.calls[0][0].data;
    expect(data.previousHash).toBeNull(); // genesis event
    expect(data.hash).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(data.hash).toBe(
      computeAuditHash(null, {
        action: 'SYSTEM_ACTION',
        timestamp: data.timestamp.toISOString(),
      })
    );
  });

  it('propagates persistence failures to the caller', async () => {
    createMock.mockRejectedValueOnce(new Error('db down'));
    await expect(logAuditEvent({ action: 'FAILING_ACTION' })).rejects.toThrow(
      /Audit log persistence failed for action "FAILING_ACTION"/
    );
  });
});

describe('computeAuditHash (§6.1 chain integrity)', () => {
  const baseEvent = {
    action: 'RUBRIC_STATUS_CHANGED',
    actorId: 'u1',
    affectedRecordId: 'r1',
    previousValues: '{"status":"DRAFT"}',
    newValues: '{"status":"APPROVED"}',
    organizationId: 'org-1',
    timestamp: '2026-09-20T00:00:00.000Z',
  };

  it('is deterministic for identical payloads', () => {
    expect(computeAuditHash('h1', baseEvent)).toBe(computeAuditHash('h1', baseEvent));
  });

  it('changes when any part of the event content changes', () => {
    const original = computeAuditHash('h1', baseEvent);
    expect(computeAuditHash('h1', { ...baseEvent, action: 'TAMPERED' })).not.toBe(original);
    expect(computeAuditHash('h1', { ...baseEvent, newValues: '{"status":"REJECTED"}' })).not.toBe(original);
  });

  it('changes when the previous hash changes, so edits to old events invalidate successors', () => {
    const event1Hash = computeAuditHash(null, baseEvent);
    const event2Hash = computeAuditHash(event1Hash, { ...baseEvent, action: 'SECOND' });
    // If an attacker edits event 1 in place, event 1's hash changes, so the
    // stored previousHash on event 2 no longer verifies.
    expect(computeAuditHash('forged', { ...baseEvent, action: 'SECOND' })).not.toBe(event2Hash);
  });
});
