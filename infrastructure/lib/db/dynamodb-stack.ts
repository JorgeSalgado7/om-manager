import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions'

export class DbStack extends cdk.Stack {

  public readonly organizationTable: dynamodb.Table
  public readonly memberTable: dynamodb.Table
  public readonly memberOrgTable: dynamodb.Table

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {

    super(scope, id, props)

    this.organizationTable = new dynamodb.Table(this, 'OrganizationTable', {
      tableName: 'om-organization',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    })

    this.memberTable = new dynamodb.Table(this, 'MemberTable', {
      tableName: 'om-member',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    })

    this.memberOrgTable = new dynamodb.Table(this, 'MemberOrganizationTable', {
      tableName: 'om-member-organization',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    })

    this.memberOrgTable.addGlobalSecondaryIndex({
      indexName: 'ByMemberId',
      partitionKey: { name: 'id_member', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    this.memberOrgTable.addGlobalSecondaryIndex({
      indexName: 'ByOrganizationId',
      partitionKey: { name: 'id_organization', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    const errorTopic = new sns.Topic(this, 'DynamoDbErrorTopic', {
      displayName: 'Alarma errores DynamoDB OM Manager',
    })

    errorTopic.addSubscription(new subscriptions.EmailSubscription('jorge.salgadoh@outlook.com'))

    const dynamoTables = [
      { table: this.organizationTable, name: 'OrganizationTable' },
      { table: this.memberTable, name: 'MemberTable' },
      { table: this.memberOrgTable, name: 'MemberOrganizationTable' },
    ]

    dynamoTables.forEach(({ table, name }) => {

      const throttleAlarm = new cloudwatch.Alarm(this, `${name}ThrottleAlarm`, {
        metric: table.metric('ThrottledRequests'),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: `Alarma para solicitudes limitadas (throttled) en la tabla ${name}`,
        actionsEnabled: true,
      })

      throttleAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(errorTopic))

      const systemErrorsAlarm = new cloudwatch.Alarm(this, `${name}SystemErrorsAlarm`, {
        metric: table.metric('SystemErrors'),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: `Alarma para errores del sistema en la tabla ${name}`,
        actionsEnabled: true,
      })

      systemErrorsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(errorTopic))

      const userErrorsAlarm = new cloudwatch.Alarm(this, `${name}UserErrorsAlarm`, {
        metric: table.metric('UserErrors'),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: `Alarma para errores de usuario en la tabla ${name}`,
        actionsEnabled: true,
      })

      userErrorsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(errorTopic))

    })

		new cdk.CfnOutput(this, 'OrganizationTableName', {
      value: this.organizationTable.tableName,
      exportName: 'OMOrganizationTableName',
    })

    new cdk.CfnOutput(this, 'MemberTableName', {
      value: this.memberTable.tableName,
      exportName: 'OMMemberTableName',
    })

    new cdk.CfnOutput(this, 'MemberOrgTableName', {
      value: this.memberOrgTable.tableName,
      exportName: 'OMMemberOrgTableName',
    })

  }

}
