import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import { getUser } from '../kinde'

import { db } from '../db'
import { expenses as expenseTable } from '../db/schema/expenses'
import { eq, desc, sum, and } from 'drizzle-orm'

const expenseSchema = z.object({
  id: z.number().int().positive().min(1),
  title: z.string().min(3).max(100),
  amount: z.string()
})

type Expense = z.infer<typeof expenseSchema>

const createPostSchema = expenseSchema.omit({ id: true })

export const expensesRoute = new Hono()
  .get('/', getUser, async ctx => {
    const user = ctx.var.user

    const expenses = await db
      .select()
      .from(expenseTable)
      .where(eq(expenseTable.userId, user.id))
      .orderBy(desc(expenseTable.createdAt))
      .limit(100)

    return ctx.json({ expenses })
  })
  .post('/', getUser, zValidator('json', createPostSchema), async ctx => {
    const expense = await ctx.req.valid('json')
    const user = ctx.var.user

    const result = await db
      .insert(expenseTable)
      .values({
        ...expense,
        userId: user.id
      })
      .returning()

    ctx.status(201)
    return ctx.json(result)
  })
  .get('/total-spent', getUser, async ctx => {
    const user = ctx.var.user
    const total = await db
      .select({ total: sum(expenseTable.amount) })
      .from(expenseTable)
      .where(eq(expenseTable.userId, user.id))
      .limit(1)
      .then(result => result[0].total)
    return ctx.json({ total })
  })
  .get('/:id{[0-9]+}', getUser, async ctx => {
    const id = Number.parseInt(ctx.req.param('id'))
    const user = ctx.var.user

    const expense = await db
      .select()
      .from(expenseTable)
      .where(and(eq(expenseTable.userId, user.id), eq(expenseTable.id, id)))
      .then(result => result[0])

    if (!expense) {
      return ctx.notFound()
    }

    return ctx.json({ expense })
  })
  .delete('/:id{[0-9]+}', getUser, async ctx => {
    const id = Number.parseInt(ctx.req.param('id'))
    const user = ctx.var.user

    const expense = await db
      .delete(expenseTable)
      .where(and(eq(expenseTable.userId, user.id), eq(expenseTable.id, id)))
      .returning()
      .then(result => result[0])

    if (!expense) {
      return ctx.notFound()
    }

    return ctx.json({ expense: expense })
  })
