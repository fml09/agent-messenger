import { describe, expect, it } from 'bun:test'

import { getLocoDeviceConfig } from './config'

describe('KakaoTalk LOCO device profiles', () => {
  it('keeps the tablet profile as dtype 2 and a sub-device', () => {
    expect(getLocoDeviceConfig('tablet')).toMatchObject({
      os: 'android',
      appVersion: '25.9.2',
      useSub: true,
      dtype: 2,
    })
  })

  it('uses dtype 1 and main-device CHECKIN semantics for android-main', () => {
    expect(getLocoDeviceConfig('android-main')).toEqual({
      os: 'android',
      appVersion: '25.9.2',
      useSub: false,
      dtype: 1,
    })
  })

  it('keeps the PC profile on the existing dtype 2 path', () => {
    expect(getLocoDeviceConfig('pc')).toMatchObject({
      useSub: false,
      dtype: 2,
    })
    expect(getLocoDeviceConfig('pc').os).not.toBe('android')
  })
})
