import { createMember } from "../createMember.js";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

// Mock general sin usar PutCommand dentro del mock factory
jest.mock("@aws-sdk/lib-dynamodb", () => {
  const originalModule = jest.requireActual("@aws-sdk/lib-dynamodb");

  return {
    ...originalModule,
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({
        send: jest.fn((command) => {
          // Usa constructor.name para identificar el comando sin usar la variable PutCommand
          if (command.constructor.name === "PutCommand") {
            return Promise.resolve({});
          }
          return Promise.reject(new Error("Unknown command"));
        }),
      }),
    },
  };
});

const mockHeaders = {
  "Content-Type": "application/json",
};

describe("createMember Lambda", () => {
  it("should return 400 if email is missing", async () => {
    const event = { body: JSON.stringify({}) };
    const response = await createMember(event, mockHeaders);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.notification.error).toBe(true);
    expect(body.notification.message).toBe("Email required");
  });

  it("should return 201 and create member", async () => {
    const event = { body: JSON.stringify({ email: "test@example.com" }) };
    const response = await createMember(event, mockHeaders);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(body.notification.error).toBe(false);
    expect(body.data.email).toBe("test@example.com");
    expect(body.data.id).toBeDefined();
    expect(body.data.status).toBe("active");
    expect(body.data.created_at).toBeDefined();
    expect(body.data.updated_at).toBeDefined();
  });

  it("should return 409 if email already exists", async () => {
    const mockSend = jest.fn((command) => {
      if (command.constructor.name === "PutCommand") {
        const error = new Error("Conflict");
        error.name = "ConditionalCheckFailedException";
        return Promise.reject(error);
      }
    });

    jest
      .spyOn(require("@aws-sdk/lib-dynamodb").DynamoDBDocumentClient, "from")
      .mockReturnValueOnce({ send: mockSend });

    const event = { body: JSON.stringify({ email: "duplicate@example.com" }) };
    const response = await createMember(event, mockHeaders);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(409);
    expect(body.notification.error).toBe(true);
    expect(body.notification.message).toBe("Member with this email already exists");
  });

  it("should return 500 on unexpected error", async () => {
    const mockSend = jest.fn(() => Promise.reject(new Error("Unexpected failure")));

    jest
      .spyOn(require("@aws-sdk/lib-dynamodb").DynamoDBDocumentClient, "from")
      .mockReturnValueOnce({ send: mockSend });

    const event = { body: JSON.stringify({ email: "test@example.com" }) };
    const response = await createMember(event, mockHeaders);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(500);
    expect(body.notification.error).toBe(true);
    expect(body.notification.message).toBe("Internal Server Error");
  });
});
