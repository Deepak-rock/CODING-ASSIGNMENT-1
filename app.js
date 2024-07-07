const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')

const app = express()
app.use(express.json())

const databasePath = path.join(__dirname, 'todoApplication.db')
let database = null

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server is Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`ERROR: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryAndStatusProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriorityProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const checkRequestQuery = async (request, response, next) => {
  const {date} = request.query

  if (date !== undefined) {
    try {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd')
      const result = toDate(formattedDate)
      const isValidDate = isValid(result)

      if (isValidDate) {
        request.date = formattedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  next()
}

const outPutResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}

// API 1

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''

  const {search_q = '', priority, status, category} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
                                SELECT 
                                    * 
                                FROM 
                                    todo 
                                WHERE status = '${status}' AND priority = '${priority}';
          `

          data = await database.all(getTodosQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `
                            SELECT 
                                * 
                            FROM 
                                todo 
                            WHERE priority = '${priority}';
          `
        data = await database.all(getTodosQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `
                            SELECT 
                                * 
                            FROM 
                                todo 
                            WHERE status = '${status}';
          `
        data = await database.all(getTodosQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
                                SELECT 
                                    * 
                                FROM 
                                    todo 
                                WHERE status = '${status}' AND category = '${category}';
          `
          data = await database.all(getTodosQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodosQuery = `
                                SELECT 
                                    * 
                                FROM 
                                    todo 
                                WHERE priority = '${priority}' AND category = '${category}';
          `
          data = await database.all(getTodosQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `
                            SELECT 
                                * 
                            FROM 
                                todo 
                            WHERE category = '${category}';
          `
        data = await database.all(getTodosQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasSearchProperty(request.query):
      getTodosQuery = `
            SELECT * 
            FROM todo 
            WHERE todo LIKE '%${search_q}%';
          `
      data = await database.all(getTodosQuery)
      response.send(data.map(eachItem => outPutResult(eachItem)))
      break
    default:
      getTodosQuery = `
        SELECT
          *
        FROM
          todo
      `
      data = await database.all(getTodosQuery)
      response.send(data.map(eachItem => outPutResult(eachItem)))
      break
  }
})

// API 2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
                            SELECT 
                                * 
                            FROM 
                                todo 
                            WHERE id = ${todoId};
    `
  const todoItem = await database.get(getTodoQuery)
  response.send(outPutResult(todoItem))
})

// API 3

app.get('/agenda/', checkRequestQuery, async (request, response) => {
  const {date} = request.query // Correctly read the date from query parameters

  if (date === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
    return
  }

  try {
    const formattedDate = format(new Date(date), 'yyyy-MM-dd')
    const isValidDate = isValid(toDate(formattedDate))

    if (!isValidDate) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }

    const getAgendaQuery = `
      SELECT *
      FROM todo
      WHERE due_date = '${formattedDate}';
    `
    const selectTodoDate = await database.all(getAgendaQuery)

    response.send(selectTodoDate.map(eachItem => outPutResult(eachItem)))
  } catch (e) {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

// API 4

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  const validPriorities = ['HIGH', 'MEDIUM', 'LOW']
  const validStatuses = ['TO DO', 'IN PROGRESS', 'DONE']
  const validCategories = ['WORK', 'HOME', 'LEARNING']

  if (!validPriorities.includes(priority)) {
    response.status(400)
    response.send('Invalid Todo Priority')
    return
  }

  if (!validStatuses.includes(status)) {
    response.status(400)
    response.send('Invalid Todo Status')
    return
  }

  if (!validCategories.includes(category)) {
    response.status(400)
    response.send('Invalid Todo Category')
    return
  }

  try {
    const formattedDate = format(new Date(dueDate), 'yyyy-MM-dd')
    const isValidDate = isValid(toDate(formattedDate))

    if (!isValidDate) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }

    const postTodoQuery = `
      INSERT INTO todo (id, todo, priority, status, category, due_date)
      VALUES (
        '${id}', '${todo}', '${priority}', '${status}', '${category}', '${formattedDate}'
      );
    `
    await database.run(postTodoQuery)
    response.send('Todo Successfully Added')
  } catch (e) {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

// API 5

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {todo, priority, status, category, dueDate} = request.body

  const validPriorities = ['HIGH', 'MEDIUM', 'LOW']
  const validStatuses = ['TO DO', 'IN PROGRESS', 'DONE']
  const validCategories = ['WORK', 'HOME', 'LEARNING']

  if (priority !== undefined && !validPriorities.includes(priority)) {
    response.status(400)
    response.send('Invalid Todo Priority')
    return
  }

  if (status !== undefined && !validStatuses.includes(status)) {
    response.status(400)
    response.send('Invalid Todo Status')
    return
  }

  if (category !== undefined && !validCategories.includes(category)) {
    response.status(400)
    response.send('Invalid Todo Category')
    return
  }

  if (dueDate !== undefined) {
    try {
      const formattedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      const isValidDate = isValid(toDate(formattedDate))

      if (!isValidDate) {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }

      await database.run(`
        UPDATE todo
        SET due_date = '${formattedDate}'
        WHERE id = ${todoId};
      `)
      response.send('Due Date Updated')
      return
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  if (todo !== undefined) {
    await database.run(`
      UPDATE todo
      SET todo = '${todo}'
      WHERE id = ${todoId};
    `)
    response.send('Todo Updated')
    return
  }

  if (priority !== undefined) {
    await database.run(`
      UPDATE todo
      SET priority = '${priority}'
      WHERE id = ${todoId};
    `)
    response.send('Priority Updated')
    return
  }

  if (status !== undefined) {
    await database.run(`
      UPDATE todo
      SET status = '${status}'
      WHERE id = ${todoId};
    `)
    response.send('Status Updated')
    return
  }

  if (category !== undefined) {
    await database.run(`
      UPDATE todo
      SET category = '${category}'
      WHERE id = ${todoId};
    `)
    response.send('Category Updated')
    return
  }
})

// API 6

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
                            DELETE FROM
                                todo
                            WHERE 
                                id = ${todoId};
  `
  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
