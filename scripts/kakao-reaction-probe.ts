#!/usr/bin/env bun
/**
 * Probe KakaoTalk's private expanded reaction API with the current account.
 *
 * Read-only by default: --query searches the reaction catalog and --members
 * fetches reaction users for one message. Mutations require --confirm.
 *
 * Usage:
 *   bun scripts/kakao-reaction-probe.ts --query "엄지척"
 *   bun scripts/kakao-reaction-probe.ts --query "" --pretty
 *   bun scripts/kakao-reaction-probe.ts --members --chat-id 123 --log-id 456
 *   bun scripts/kakao-reaction-probe.ts --add 1200282_026 --chat-id 123 --log-id 456 --confirm
 *   bun scripts/kakao-reaction-probe.ts --remove 1200282_026 --chat-id 123 --log-id 456 --confirm
 */

import { KakaoTalkClient } from '../src/platforms/kakaotalk/client'
import { KakaoCredentialManager } from '../src/platforms/kakaotalk/credential-manager'

const HELP = `
kakao-reaction-probe — probe KakaoTalk's expanded reaction API

Read-only operations:
  --query <text>       Search the reaction catalog; use an empty string for all results
  --members            List reaction IDs and user IDs for one message

Mutation operations (require --confirm):
  --add <reaction-id>  Add a catalog reaction to a message
  --remove <reaction-id>
                       Remove a catalog reaction from a message

Shared options:
  --chat-id <id>       Chat room ID
  --log-id <id>        Message log ID
  --link-id <id>       OpenChat link ID
  --account <id>       Use a specific stored KakaoTalk account
  --pretty             Pretty-print JSON output
  --confirm            Enable --add/--remove (never implied)
  --help               Show this help

Examples:
  bun scripts/kakao-reaction-probe.ts --query "엄지척"
  bun scripts/kakao-reaction-probe.ts --query "" --pretty
  bun scripts/kakao-reaction-probe.ts --members --chat-id 123 --log-id 456
  bun scripts/kakao-reaction-probe.ts --add 1200282_026 --chat-id 123 --log-id 456 --confirm
`

type Operation =
  | { kind: 'search'; query: string }
  | { kind: 'members' }
  | { kind: 'add' | 'remove'; reactionId: string }

type Args = {
  operation?: Operation
  chatId?: string
  logId?: string
  linkId?: string
  account?: string
  pretty: boolean
  confirm: boolean
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1]
  if (value === undefined) throw new Error(`${flag} requires a value`)
  return value
}

function parseArgs(argv: string[]): Args {
  const args: Args = { pretty: false, confirm: false }

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    switch (flag) {
      case '--query':
        args.operation = { kind: 'search', query: requireValue(argv, index, flag) }
        index += 1
        break
      case '--members':
        args.operation = { kind: 'members' }
        break
      case '--add':
        args.operation = { kind: 'add', reactionId: requireValue(argv, index, flag) }
        index += 1
        break
      case '--remove':
        args.operation = { kind: 'remove', reactionId: requireValue(argv, index, flag) }
        index += 1
        break
      case '--chat-id':
        args.chatId = requireValue(argv, index, flag)
        index += 1
        break
      case '--log-id':
        args.logId = requireValue(argv, index, flag)
        index += 1
        break
      case '--link-id':
        args.linkId = requireValue(argv, index, flag)
        index += 1
        break
      case '--account':
        args.account = requireValue(argv, index, flag)
        index += 1
        break
      case '--pretty':
        args.pretty = true
        break
      case '--confirm':
        args.confirm = true
        break
      case '--help':
      case '-h':
        console.log(HELP)
        process.exit(0)
      default:
        throw new Error(`Unknown option: ${flag}`)
    }
  }

  if (!args.operation) throw new Error('Choose --query, --members, --add, or --remove')
  if (args.operation.kind !== 'search' && (!args.chatId || !args.logId)) {
    throw new Error('--chat-id and --log-id are required for --members, --add, and --remove')
  }
  if ((args.operation.kind === 'add' || args.operation.kind === 'remove') && !args.confirm) {
    throw new Error('Mutations require --confirm; no reaction was sent')
  }
  return args
}

function print(value: unknown, pretty: boolean): void {
  console.log(JSON.stringify(value, null, pretty ? 2 : 0))
}

async function withClient<T>(
  accountId: string | undefined,
  callback: (client: KakaoTalkClient) => Promise<T>,
): Promise<T> {
  const account = await new KakaoCredentialManager().getAccount(accountId)
  if (!account) {
    throw new Error(
      accountId
        ? `KakaoTalk account "${accountId}" not found`
        : 'No KakaoTalk credentials found; run agent-kakaotalk auth login first',
    )
  }

  const client = await new KakaoTalkClient().login(undefined, account.account_id)
  try {
    return await callback(client)
  } finally {
    client.close()
  }
}

async function run(args: Args): Promise<unknown> {
  const operation = args.operation!
  return withClient(args.account, async (client) => {
    switch (operation.kind) {
      case 'search':
        return { success: true, data: await client.searchReactions(operation.query) }
      case 'members':
        return {
          success: true,
          data: await client.getReactionMembers(
            args.chatId!,
            args.logId!,
            args.linkId ? { linkId: args.linkId } : undefined,
          ),
        }
      case 'add':
        return {
          result: await client.addReaction(
            args.chatId!,
            args.logId!,
            operation.reactionId,
            args.linkId ? { linkId: args.linkId } : undefined,
          ),
        }
      case 'remove':
        return {
          result: await client.removeReaction(
            args.chatId!,
            args.logId!,
            operation.reactionId,
            args.linkId ? { linkId: args.linkId } : undefined,
          ),
        }
    }
  })
}

try {
  const args = parseArgs(process.argv.slice(2))
  const result = await run(args)
  print(result, args.pretty)
} catch (error) {
  print({ error: error instanceof Error ? error.message : String(error) }, false)
  process.exitCode = 1
}
