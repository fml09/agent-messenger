import { describe, expect, it, mock } from 'bun:test'

import { KakaoReactionClient } from './reaction-client'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('KakaoReactionClient', () => {
  it('reads the current revision before adding a reaction', async () => {
    const fetchImpl = mock(async (_url: string | URL | Request, _init?: RequestInit) =>
      jsonResponse({ logExtras: { '42': { revision: '7' } } }),
    )
    fetchImpl.mockResolvedValueOnce(jsonResponse({ logExtras: { '42': { revision: '7' } } }))
    fetchImpl.mockResolvedValueOnce(jsonResponse({ revision: '8' }))
    const client = new KakaoReactionClient({ accessToken: 'access-token', deviceUuid: 'device-uuid', fetchImpl })

    const result = await client.add({ chatId: '100', logId: '42', reactionId: '1200282_026' })

    expect(result).toEqual({ status: 200, body: { revision: '8' }, revision: '7' })
    expect(fetchImpl).toHaveBeenCalledTimes(2)

    const [revisionUrl, revisionInit] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(revisionUrl).toBe('https://talk-pilsner.kakao.com/emoticon/chat/rx/log-extras')
    expect(revisionInit.headers).toEqual({
      authorization: 'access-token-device-uuid',
      connection: 'Keep-Alive',
      'talk-agent': 'android/26.4.1',
      'talk-language': 'ko',
      'user-agent': 'okhttp/4.12.0',
      'content-type': 'application/json; charset=UTF-8',
    })
    expect(JSON.parse(String(revisionInit.body))).toEqual({ chatId: '100', logIds: ['42'] })

    const [addUrl, addInit] = fetchImpl.mock.calls[1] as unknown as [string, RequestInit]
    expect(addUrl).toBe('https://talk-pilsner.kakao.com/emoticon/chat/rx/do')
    expect(addInit.headers).toEqual(revisionInit.headers)
    expect(JSON.parse(String(addInit.body))).toMatchObject({
      chatId: '100',
      logId: '42',
      revision: '7',
      reactions: { add: [{ k: 2, o: '1200282_026' }] },
    })
    expect(JSON.parse(String(addInit.body)).tag).toMatch(/^add_\d+$/)
  })

  it('adds linkId to revision and removal requests for OpenChat', async () => {
    const fetchImpl = mock(async () => jsonResponse({ logExtras: { '42': { revision: '9' } } }))
    fetchImpl.mockResolvedValueOnce(jsonResponse({ logExtras: { '42': { revision: '9' } } }))
    fetchImpl.mockResolvedValueOnce(jsonResponse({ revision: '10' }))
    const client = new KakaoReactionClient({ accessToken: 'access-token', deviceUuid: 'device-uuid', fetchImpl })

    await client.remove({ chatId: '100', logId: '42', reactionId: '1200282_026', linkId: '777' })

    const [, revisionInit] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    const [, removeInit] = fetchImpl.mock.calls[1] as unknown as [string, RequestInit]
    expect(JSON.parse(String(revisionInit.body))).toEqual({ chatId: '100', logIds: ['42'], linkId: '777' })
    expect(JSON.parse(String(removeInit.body))).toMatchObject({
      chatId: '100',
      logId: '42',
      revision: '9',
      linkId: '777',
      reactions: { remove: [{ k: 2, o: '1200282_026' }] },
    })
  })

  it('returns reaction members from the form endpoint', async () => {
    const fetchImpl = mock(async () => jsonResponse({ details: [{ o: '1200282_026', u: ['1', '2'] }] }))
    const client = new KakaoReactionClient({ accessToken: 'access-token', deviceUuid: 'device-uuid', fetchImpl })

    const result = await client.member('100', '42', '777')

    expect(result).toEqual({ status: 200, body: { details: [{ o: '1200282_026', u: ['1', '2'] }] } })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://talk-pilsner.kakao.com/emoticon/chat/rx/log-details')
    expect(init.headers).toMatchObject({
      authorization: 'access-token-device-uuid',
      'content-type': 'application/x-www-form-urlencoded',
    })
    expect(String(init.body)).toBe('chatId=100&logId=42&linkId=777')
  })

  it('searches the reaction catalog with the instant-search payload', async () => {
    const fetchImpl = mock(async () => jsonResponse({ results: [{ o: '1200282_026' }] }))
    const client = new KakaoReactionClient({ accessToken: 'access-token', deviceUuid: 'device-uuid', fetchImpl })

    const result = await client.search('엄지척')

    expect(result).toEqual({ status: 200, body: { results: [{ o: '1200282_026' }] } })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://talk-pilsner.kakao.com/emoticon/chat/rx/views/reactions/instant-search')
    expect(JSON.parse(String(init.body))).toMatchObject({ q: '엄지척', sequence: 1 })
    expect(JSON.parse(String(init.body)).sessionId).toMatch(/^[0-9a-f-]{36}$/)
  })
})
