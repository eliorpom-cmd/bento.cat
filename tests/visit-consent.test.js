import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VisitConsent } from '../src/lib/visit-consent.js';
import { Visitor } from '../src/lib/engine/state.js';

const CHOICE = 'bento.cat/visit-consent.v1', KEY = 'bento.cat/statistics-key.v1';
let values, local;
beforeEach(() => {
  vi.useFakeTimers();
  values = new Map();
  local = {
    getItem: vi.fn(key => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn(key => values.delete(key)),
  };
  vi.stubGlobal('localStorage', local);
  VisitConsent.choice = null; VisitConsent.key = ''; VisitConsent.expiresAt = 0;
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('browser consent', () => {
  it('does not read or create a persistent visitor key before consent', () => {
    values.set('bento.cat/visitor-key', 'old-automatic-key');
    values.set(KEY, 'stale-key');
    Visitor.load(); VisitConsent.load();
    Visitor.set('purr', 'mia/purr1', true);
    expect(Visitor.key).toHaveLength(32);
    expect(Visitor.get('purr', 'mia/purr1')).toBe(true);
    expect(local.getItem.mock.calls).toEqual([[CHOICE]]);
    expect(local.setItem).not.toHaveBeenCalled();
    expect(values.has(KEY)).toBe(false);
    expect(values.has('bento.cat/visitor-key')).toBe(false);
    expect(VisitConsent.choice).toBeNull();
  });

  it('declining stores only the choice and keeps interactions available', () => {
    Visitor.load(); VisitConsent.load(); VisitConsent.choose(false);
    expect(values.has(KEY)).toBe(false);
    expect(JSON.parse(values.get(CHOICE)).allowed).toBe(false);
    expect(Visitor.key).toHaveLength(32);
    expect(VisitConsent.key).toBe('');
  });

  it('only explicit acceptance persists a separate statistics key, and withdrawal removes it', () => {
    Visitor.load(); VisitConsent.load(); VisitConsent.choose(true);
    const key = VisitConsent.key;
    expect(key).toHaveLength(32);
    expect(key).not.toBe(Visitor.key);
    expect(values.get(KEY)).toBe(key);
    VisitConsent.load();
    expect(VisitConsent.key).toBe(key);
    expect(VisitConsent.choose(false)).toBe(key);
    expect(values.has(KEY)).toBe(false);
    expect(VisitConsent.key).toBe('');
  });

  it('expired or malformed choices never grant consent', () => {
    for (const saved of ['bad json', JSON.stringify({ allowed: 'true', expiresAt: Date.now() + 1000 }), JSON.stringify({ allowed: true, expiresAt: Date.now() - 1 })]) {
      values.set(CHOICE, saved); values.set(KEY, 'a'.repeat(32));
      VisitConsent.load();
      expect(VisitConsent.choice).toBeNull();
      expect(VisitConsent.key).toBe('');
      expect(values.has(KEY)).toBe(false);
    }
  });

  it('expires consent in an already open tab and notifies subscribers', () => {
    VisitConsent.choose(true);
    const fn = vi.fn(), stop = VisitConsent.subscribe(fn);
    vi.advanceTimersByTime(180 * 24 * 60 * 60 * 1000);
    VisitConsent.checkExpiry();
    expect(VisitConsent.choice).toBeNull();
    expect(VisitConsent.key).toBe('');
    expect(values.has(KEY)).toBe(false);
    expect(fn).toHaveBeenCalledTimes(2);
    stop();
  });

  it('blocked browser storage leaves all choices and interactions usable in memory', () => {
    for (const fn of Object.values(local)) fn.mockImplementation(() => { throw new Error('Storage blocked'); });
    expect(() => { Visitor.load(); VisitConsent.load(); VisitConsent.choose(true); Visitor.set('sub', 'mia/list', true); }).not.toThrow();
    expect(VisitConsent.key).toHaveLength(32);
    expect(Visitor.get('sub', 'mia/list')).toBe(true);
    expect(() => VisitConsent.choose(false)).not.toThrow();
    expect(VisitConsent.key).toBe('');
  });
});
