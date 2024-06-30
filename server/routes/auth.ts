import { Hono } from 'hono'

import { kindeClient, sessionManager, getUser } from '../kinde'

export const authRoute = new Hono()
  .get('/login', async ctx => {
    const loginUrl = await kindeClient.login(sessionManager(ctx))
    return ctx.redirect(loginUrl.toString())
  })
  .get('/register', async ctx => {
    const registerUrl = await kindeClient.register(sessionManager(ctx))
    return ctx.redirect(registerUrl.toString())
  })
  .get('/callback', async ctx => {
    // Gets called every time we login or register
    const url = new URL(ctx.req.url)
    await kindeClient.handleRedirectToApp(sessionManager(ctx), url)
    return ctx.redirect('/')
  })
  .get('/logout', async ctx => {
    const logoutUrl = await kindeClient.logout(sessionManager(ctx))
    return ctx.redirect(logoutUrl.toString())
  })
  .get('/me', getUser, async ctx => {
    const user = ctx.var.user
    return ctx.json({ user })
  })
