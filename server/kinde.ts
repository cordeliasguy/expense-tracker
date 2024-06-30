import {
  createKindeServerClient,
  GrantType,
  type SessionManager,
  type UserType
} from '@kinde-oss/kinde-typescript-sdk'
import { type Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'

// Client for authorization code flow
export const kindeClient = createKindeServerClient(
  GrantType.AUTHORIZATION_CODE,
  {
    authDomain: process.env.KINDE_DOMAIN!,
    clientId: process.env.KINDE_CLIENT_ID!,
    clientSecret: process.env.KINDE_CLIENT_SECRET!,
    redirectURL: process.env.KINDE_REDIRECT_URI!,
    logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URI!
  }
)

let store: Record<string, unknown> = {}

export const sessionManager = (ctx: Context): SessionManager => ({
  async getSessionItem(key: string) {
    const result = getCookie(ctx, key)
    return result
  },
  async setSessionItem(key: string, value: unknown) {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    } as const
    if (typeof value === 'string') {
      setCookie(ctx, key, value, cookieOptions)
    } else {
      setCookie(ctx, key, JSON.stringify(value), cookieOptions)
    }
  },
  async removeSessionItem(key: string) {
    deleteCookie(ctx, key)
  },
  async destroySession() {
    ;['id_token', 'access_token', 'user', 'refresh_token'].forEach(key => {
      deleteCookie(ctx, key)
    })
  }
})

type Env = {
  Variables: {
    user: UserType
  }
}

export const getUser = createMiddleware<Env>(async (ctx, next) => {
  try {
    const manager = sessionManager(ctx)
    const isAuthenticated = await kindeClient.isAuthenticated(manager)
    if (!isAuthenticated) {
      return ctx.json({ error: 'Unauthorized' }, 401)
    }
    const user = await kindeClient.getUserProfile(manager)
    ctx.set('user', user)
    await next()
  } catch (err) {
    console.error(err)
    return ctx.json({ error: 'Unauthorized' }, 401)
  }
})
