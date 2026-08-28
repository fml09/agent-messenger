import { randomUUID } from 'node:crypto'

const BASE_URL = 'https://talk-pilsner.kakao.com/emoticon/chat/rx'
const APP_VERSION = '26.4.1'
const LANGUAGE = 'ko'
const USER_AGENT = 'okhttp/4.12.0'

export type KakaoReactionId = string | number
export type KakaoReactionAction = 'add' | 'remove'

type FetchImpl = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export interface KakaoReactionMutation {
  chatId: KakaoReactionId
  logId: KakaoReactionId
  reactionId: KakaoReactionId
  linkId?: KakaoReactionId
}

export interface KakaoReactionResponse {
  status: number
  body: unknown
  revision?: string
}

export interface KakaoReactionClientOptions {
  accessToken: string
  deviceUuid: string
  fetchImpl?: FetchImpl
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function parseResponseBody(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function hasId(value: KakaoReactionId | undefined): boolean {
  return value !== undefined && value !== null && String(value) !== ''
}

function readRevision(body: unknown, logId: KakaoReactionId): string {
  const root = asRecord(body)
  const logExtras = asRecord(root?.logExtras)
  const entry = asRecord(logExtras?.[String(logId)])
  const revision = entry?.revision
  if (revision === undefined || revision === null) {
    throw new Error(`Reaction revision missing for logId=${String(logId)}`)
  }
  return String(revision)
}

export class KakaoReactionClient {
  private readonly accessToken: string
  private readonly deviceUuid: string
  private readonly fetchImpl: FetchImpl

  constructor(options: KakaoReactionClientOptions) {
    this.accessToken = options.accessToken
    this.deviceUuid = options.deviceUuid
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  private headers(form = false): Record<string, string> {
    return {
      authorization: `${this.accessToken}-${this.deviceUuid}`,
      connection: 'Keep-Alive',
      'talk-agent': `android/${APP_VERSION}`,
      'talk-language': LANGUAGE,
      'user-agent': USER_AGENT,
      'content-type': form ? 'application/x-www-form-urlencoded' : 'application/json; charset=UTF-8',
    }
  }

  private async request(path: string, body: unknown, form = false): Promise<KakaoReactionResponse> {
    const response = await this.fetchImpl(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: this.headers(form),
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
    return { status: response.status, body: parseResponseBody(await response.text()) }
  }

  private async getRevision(
    chatId: KakaoReactionId,
    logId: KakaoReactionId,
    linkId?: KakaoReactionId,
  ): Promise<KakaoReactionResponse> {
    const body: Record<string, unknown> = {
      chatId: String(chatId),
      logIds: [String(logId)],
    }
    if (hasId(linkId)) body.linkId = String(linkId)

    const response = await this.request('/log-extras', body)
    if (response.status !== 200) return response
    return { ...response, revision: readRevision(response.body, logId) }
  }

  private async mutate(action: KakaoReactionAction, input: KakaoReactionMutation): Promise<KakaoReactionResponse> {
    const revisionResponse = await this.getRevision(input.chatId, input.logId, input.linkId)
    if (revisionResponse.status !== 200) return revisionResponse

    const body: Record<string, unknown> = {
      chatId: String(input.chatId),
      logId: String(input.logId),
      revision: revisionResponse.revision,
      reactions: {
        [action]: [{ k: 2, o: String(input.reactionId) }],
      },
      tag: `${action}_${Date.now()}`,
    }
    if (hasId(input.linkId)) body.linkId = String(input.linkId)

    const response = await this.request('/do', body)
    return { ...response, revision: revisionResponse.revision }
  }

  async add(input: KakaoReactionMutation): Promise<KakaoReactionResponse> {
    return this.mutate('add', input)
  }

  async remove(input: KakaoReactionMutation): Promise<KakaoReactionResponse> {
    return this.mutate('remove', input)
  }

  async member(
    chatId: KakaoReactionId,
    logId: KakaoReactionId,
    linkId?: KakaoReactionId,
  ): Promise<KakaoReactionResponse> {
    const params = new URLSearchParams({ chatId: String(chatId), logId: String(logId) })
    if (hasId(linkId)) params.set('linkId', String(linkId))
    return this.request('/log-details', params.toString(), true)
  }

  async search(query: string): Promise<KakaoReactionResponse> {
    return this.request('/views/reactions/instant-search', {
      q: query,
      sessionId: randomUUID(),
      sequence: 1,
    })
  }
}
