import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const expenseSchema = z.object({
  id: z.number().int().positive().min(1),
  title: z.string().min(3).max(100),
  amount: z.number().int().positive()
})

type Expense = z.infer<typeof expenseSchema>

const createPostSchema = expenseSchema.omit({ id: true })

const fakeExpenses: Expense[] = [
  { id: 1, title: 'Lunch', amount: 100 },
  { id: 2, title: 'Dinner', amount: 200 },
  { id: 3, title: 'Movie', amount: 300 }
]

export const expensesRoute = new Hono()
  .get('/', ctx => {
    return ctx.json({ expenses: fakeExpenses })
  })
  .post('/', zValidator('json', createPostSchema), async ctx => {
    const expense = await ctx.req.valid('json')
    fakeExpenses.push({ ...expense, id: fakeExpenses.length + 1 })
    ctx.status(201)
    return ctx.json(expense)
  })
  .get('/total-spent', ctx => {
    const total = fakeExpenses.reduce((acc, expense) => acc + expense.amount, 0)
    return ctx.json({ total })
  })
  .get('/:id{[0-9]+}', ctx => {
    const id = Number.parseInt(ctx.req.param('id'))
    const expense = fakeExpenses.find(expense => expense.id === id)

    if (!expense) {
      return ctx.notFound()
    }

    return ctx.json({ expense })
  })
  .delete('/:id{[0-9]+}', ctx => {
    const id = Number.parseInt(ctx.req.param('id'))
    const index = fakeExpenses.findIndex(expense => expense.id === id)

    if (index === -1) {
      return ctx.notFound()
    }

    const deletedExpense = fakeExpenses.splice(index, 1)[0]
    return ctx.json({ expense: deletedExpense })
  })
