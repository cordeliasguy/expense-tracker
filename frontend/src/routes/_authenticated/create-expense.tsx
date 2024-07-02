import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'

import { useForm } from '@tanstack/react-form'
import type { FieldApi } from '@tanstack/react-form'
import {
  createExpense,
  getAllExpensesQueryOptions,
  loadingCreateExpenseQueryOptions
} from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

import { zodValidator } from '@tanstack/zod-form-adapter'

import { createExpenseSchema } from '@server/sharedTypes'

export const Route = createFileRoute('/_authenticated/create-expense')({
  component: CreateExpense
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.touchedErrors ? (
        <em>{field.state.meta.touchedErrors}</em>
      ) : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  )
}

function CreateExpense() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const goToExpenses = () => navigate({ to: '/expenses' })

  const form = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: {
      title: '',
      amount: '',
      date: new Date().toISOString()
    },
    onSubmit: async ({ value }) => {
      const existingExpenses = await queryClient.ensureQueryData(
        getAllExpensesQueryOptions
      )

      goToExpenses()

      queryClient.setQueryData(loadingCreateExpenseQueryOptions.queryKey, {
        expense: value
      })

      try {
        const newExpense = await createExpense({ value })

        queryClient.setQueryData(getAllExpensesQueryOptions.queryKey, {
          ...existingExpenses,
          expenses: [newExpense, ...existingExpenses.expenses]
        })

        toast.success('Expense Created', {
          description: `Successfully created new expense: ${newExpense.id}`
        })
      } catch (error) {
        console.error(error)

        toast.error('Error', {
          description: 'Failed to create new expense'
        })
      } finally {
        queryClient.setQueryData(loadingCreateExpenseQueryOptions.queryKey, {})
      }
    }
  })

  return (
    <div className="p-2">
      <h2>Hello /create-expense!</h2>

      <form
        className="flex flex-col gap-y-4 max-w-xl m-auto"
        onSubmit={e => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <form.Field
          name="title"
          validators={{
            onChange: createExpenseSchema.shape.title
          }}
          children={field => (
            <div>
              <Label htmlFor={field.name}>Title</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        />

        <form.Field
          name="amount"
          validators={{
            onChange: createExpenseSchema.shape.amount
          }}
          children={field => (
            <div>
              <Label htmlFor={field.name}>Amount</Label>
              <Input
                type="number"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        />

        <form.Field
          name="date"
          validators={{
            onChange: createExpenseSchema.shape.date
          }}
          children={field => (
            <div className="self-center">
              <Calendar
                mode="single"
                selected={new Date(field.state.value)}
                onSelect={date =>
                  field.handleChange((date ?? new Date()).toISOString())
                }
                className="rounded-md border"
              />
            </div>
          )}
        />

        <form.Subscribe
          selector={state => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button className="mt-4" type="submit" disabled={!canSubmit}>
              {isSubmitting ? '...' : 'Create Expense'}
            </Button>
          )}
        />
      </form>
    </div>
  )
}
