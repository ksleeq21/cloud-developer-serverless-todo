import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { DeleteTodoRequest } from '../requests/DeleteTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodoItem } from '../models/TodoItem'

const XAWS = AWSXRay.captureAWS(AWS)

export class TodosAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly userIdIndex = process.env.TODOS_USER_ID_INDEX
  ) {}

  async getAllTodos(userId): Promise<TodoItem[]> {
    console.log(`Getting all todos, userId: ${userId}`)

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.userIdIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async getTodo(todoId: string, userId: string) {
    const result = await this.docClient.get({
      TableName: this.todosTable,
      Key: {
        todoId,
        userId
      }
    }).promise()

    return result.Item
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todo
    }).promise()

    return todo
  }

  async updateTodo(
    userId: string,
    todoId: string,
    updateTodoRequest: UpdateTodoRequest) {
    const { name, dueDate, done } = updateTodoRequest

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: 'set #name = :name, #dueDate = :dueDate, #done = :done',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#dueDate': 'dueDate',
        '#done': 'done'
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':dueDate': dueDate,
        ':done': done
      }
    }).promise()
  }

  async deleteTodo(deleteTodoRequest: DeleteTodoRequest) {
    await this.docClient.delete({
      TableName: this.todosTable,
      Key: deleteTodoRequest
    }).promise()
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
