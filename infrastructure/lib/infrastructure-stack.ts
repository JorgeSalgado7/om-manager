import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { DbStack } from './db/dynamodb-stack'
import { BackendStack } from './lambda/backend-lambda-stack'
import { CognitoStack } from './auth/auth-stack'

export class InfrastructureStack extends cdk.Stack {

  public readonly dbStack: DbStack

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {

    super(scope, id, props)

    this.dbStack = new DbStack(this, 'DbStack', props)

    new BackendStack(this, 'BackendStack', {
      ...props,
      organizationsTable: this.dbStack.organizationTable,
      membersTable: this.dbStack.memberTable,
      memberOrganizationTable: this.dbStack.memberOrgTable,
    })

    new CognitoStack(this, 'CognitoStack')

  }

}
