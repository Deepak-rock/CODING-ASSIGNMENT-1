const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const { format, isValid, parseISO } = require('date-fns');

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
// Middleware to check and format date query
const checkRequestQuery = (request, response, next) => {
  const { date } = request.query;

  if (date !== undefined) {
    try {
      const parsedDate = parseISO(date); // Parses the date string in ISO format
      const isValidDate = isValid(parsedDate);

      if (isValidDate) {
        request.query.date = format(parsedDate, 'yyyy-MM-dd'); // Correct format
        console.log(`Parsed Date: ${parsedDate}`);
        console.log(`Formatted Date: ${request.query.date}`);
      } else {
        response.status(400).send('Invalid Due Date');
        return;
      }
    } catch (e) {
      response.status(400).send('Invalid Due Date');
      return;
    }
  }

  next();
};

// Route to get agenda
app.get('/agenda/', checkRequestQuery, async (request, response) => {
  const { date } = request.query;
  console.log(`Received date query: ${date}`); // Log the date for debugging

  try {
    const getAgendaQuery = `
      SELECT *
      FROM todo
      WHERE strftime('%Y-%m-%d', due_date) = '${date}';
    `;
    
    console.log(`Executing query: ${getAgendaQuery}`); // Log the query for debugging

    const selectTodoDate = await database.all(getAgendaQuery);

    if (selectTodoDate.length === 0) {
      console.log('No records found for the given date'); // Log if no records are found
    }

    response.send(selectTodoDate.map(eachItem => outPutResult(eachItem)));
  } catch (e) {
    console.error(`Error executing query: ${e.message}`); // Log the error
    response.status(400).send('Invalid Due Date');
  }
});

//API 4
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
    const parsedDate = parseISO(dueDate)
    const isValidDate = isValid(parsedDate)

    console.log(`parsedDate : ${parsedDate}`)
    console.log(`isValidDate : ${isValidDate}`)

    if (!isValidDate) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }

    const formattedDate = format(parsedDate, 'yyyy-MM-dd')
    console.log(`formattedDate : ${formattedDate}`)

    const postTodoQuery = `
      INSERT INTO todo (id, todo, priority, status, category, due_date)
      VALUES (
        '${id}', '${todo}', '${priority}', '${status}', '${category}', '${formattedDate}'
      );
    `
    await db.run(postTodoQuery)
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
      const parsedDate = parseISO(dueDate)
      const isValidDate = isValid(parsedDate)

      console.log(`parsedDate : ${parsedDate}`)
      console.log(`isValidDate : ${isValidDate}`)

      if (!isValidDate) {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }

      const formattedDate = format(parsedDate, 'yyyy-MM-dd')
      console.log(`formattedDate : ${formattedDate}`)
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
