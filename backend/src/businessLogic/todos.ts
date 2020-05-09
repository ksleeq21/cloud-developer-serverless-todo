import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { TodosAccess } from '../dataLayer/todosAccess'
import { BucketAccess } from '../dataLayer/BucketAccess'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { getUserId } from '../lambda/utils'

const todosAccess = new TodosAccess()
const bucketAccess = new BucketAccess()

export async function getAllTodos(event: APIGatewayProxyEvent): Promise<TodoItem[]> {
  const userId = getUserId(event)
  return todosAccess.getAllTodos(userId)
}

export async function createTodo(
  event: APIGatewayProxyEvent,
  createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {

  const { name, dueDate } = createTodoRequest
  const userId = getUserId(event)
  const todoId = uuid.v4()
  const attachmentUrl = `https://${bucketAccess.getBucketName()}.s3.amazonaws.com/${todoId}`
  const createdAt = new Date().toISOString()

  return await todosAccess.createTodo({
    userId,
    todoId,
    name,
    dueDate,
    done: false,
    attachmentUrl,
    createdAt
  })
}

export function generateSignedUploadUrl(
  todoId: string
): string {

  const bucketName = bucketAccess.getBucketName()
  const urlExpiration = bucketAccess.getUrlExpiration()

  return bucketAccess.getSignedUploadUrl({
    Bucket: bucketName,
    Expires: urlExpiration,
    Key: todoId
  })
}

export async function updateTodo(
  event: APIGatewayProxyEvent,
  todoId: string,
  updatedTodo: UpdateTodoRequest) {

  const userId = getUserId(event)

  await todosAccess.updateTodo(
    userId,
    todoId,
    updatedTodo
  )
}

export async function deleteTodo(event: APIGatewayProxyEvent) {
  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId

  await todosAccess.deleteTodo({
    userId,
    todoId
  })

  const bucketName = bucketAccess.getBucketName()
  
  await bucketAccess.deleteTodoImage({
    Bucket: bucketName,
    Key: todoId
  })
}
