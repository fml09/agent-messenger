import { expect, it } from 'bun:test'

import type { KakaoOAuthRefreshOptions } from '@/platforms/kakaotalk/index'
import {
  classifyKakaoChat,
  CredentialManager,
  KakaoOAuthRefreshError,
  KakaoAccountCredentialsSchema,
  KakaoCredentialManager,
  KakaoChatSchema,
  KakaoConfigSchema,
  KakaoReactionResultSchema,
  KakaoLeaveChatResultSchema,
  KakaoEditResultSchema,
  KakaoMessagePageSchema,
  KakaoMessageSchema,
  KakaoSendResultSchema,
  KakaoTalkClient,
  KakaoTalkError,
  isOpenKakaoChatType,
  KakaoTalkListener,
  KakaoTalkPushMemberEventSchema,
  KakaoTalkPushMessageEventSchema,
  KakaoProfileSchema,
  KakaoTalkPushReadEventSchema,
  KakaoTypingResultSchema,
  refreshKakaoOAuthToken,
} from '@/platforms/kakaotalk/index'

it('KakaoTalkClient is exported from barrel', () => {
  expect(typeof KakaoTalkClient).toBe('function')
})

it('KakaoTalkError is exported from barrel', () => {
  expect(typeof KakaoTalkError).toBe('function')
})

it('CredentialManager is exported from barrel', () => {
  expect(typeof CredentialManager).toBe('function')
})

it('KakaoCredentialManager is exported from barrel', () => {
  expect(typeof KakaoCredentialManager).toBe('function')
})

it('KakaoTalkListener is exported from barrel', () => {
  expect(typeof KakaoTalkListener).toBe('function')
})

it('KakaoChatSchema is exported from barrel', () => {
  expect(typeof KakaoChatSchema.parse).toBe('function')
})

it('KakaoMessageSchema is exported from barrel', () => {
  expect(typeof KakaoMessageSchema.parse).toBe('function')
})

it('KakaoMessagePageSchema is exported from barrel', () => {
  expect(typeof KakaoMessagePageSchema.parse).toBe('function')
})

it('KakaoSendResultSchema is exported from barrel', () => {
  expect(typeof KakaoSendResultSchema.parse).toBe('function')
})

it('KakaoEditResultSchema is exported from barrel', () => {
  expect(typeof KakaoEditResultSchema.parse).toBe('function')
})

it('exports the expanded reaction result contract from the barrel', () => {
  expect(typeof KakaoReactionResultSchema.parse).toBe('function')
  expect(
    KakaoReactionResultSchema.parse({
      success: true,
      status_code: 200,
      chat_id: '100',
      log_id: '42',
      reaction_id: '1200282_026',
      action: 'add',
      revision: '7',
    }).reaction_id,
  ).toBe('1200282_026')
})

it('KakaoAccountCredentialsSchema is exported from barrel', () => {
  expect(typeof KakaoAccountCredentialsSchema.parse).toBe('function')
})

it('KakaoConfigSchema is exported from barrel', () => {
  expect(typeof KakaoConfigSchema.parse).toBe('function')
})

it('KakaoTalkPushMessageEventSchema is exported from barrel', () => {
  expect(typeof KakaoTalkPushMessageEventSchema.parse).toBe('function')
})

it('KakaoTalkPushMemberEventSchema is exported from barrel', () => {
  expect(typeof KakaoTalkPushMemberEventSchema.parse).toBe('function')
})

it('KakaoTalkPushReadEventSchema is exported from barrel', () => {
  expect(typeof KakaoTalkPushReadEventSchema.parse).toBe('function')
})

it('KakaoProfileSchema is exported from barrel', () => {
  expect(typeof KakaoProfileSchema.parse).toBe('function')
})

it('classifyKakaoChat is exported from barrel', () => {
  expect(typeof classifyKakaoChat).toBe('function')
})

it('isOpenKakaoChatType is exported from barrel', () => {
  expect(isOpenKakaoChatType('OM')).toBe(true)
  expect(isOpenKakaoChatType(13)).toBe(true)
  expect(isOpenKakaoChatType('UNKNOWN')).toBe(false)
})

it('KakaoLeaveChatResultSchema is exported from barrel', () => {
  expect(typeof KakaoLeaveChatResultSchema.parse).toBe('function')
})

it('KakaoTypingResultSchema is exported from barrel', () => {
  expect(typeof KakaoTypingResultSchema.parse).toBe('function')
})

it('Kakao OAuth refresh API is exported from barrel', () => {
  expect(typeof refreshKakaoOAuthToken).toBe('function')
  expect(typeof KakaoOAuthRefreshError).toBe('function')

  const options: KakaoOAuthRefreshOptions = { timeoutMs: 5_000 }
  expect(options.timeoutMs).toBe(5_000)
})
