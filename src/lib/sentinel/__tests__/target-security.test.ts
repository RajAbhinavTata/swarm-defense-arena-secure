import { describe, expect, it } from 'vitest';
import { isPrivateAddress } from '../target-security';

describe('network target classification', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.2', '169.254.169.254', '::1', 'fd00::1', 'fe80::1'])(
    'blocks private or special address %s',
    (address) => expect(isPrivateAddress(address)).toBe(true),
  );

  it.each(['1.1.1.1', '8.8.8.8', '2606:4700:4700::1111'])(
    'permits public address %s',
    (address) => expect(isPrivateAddress(address)).toBe(false),
  );
});
