import { Stack, StackProps, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as cdk from 'aws-cdk-lib'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions'

interface BackendStackProps extends StackProps {
  organizationsTable: dynamodb.ITable
  membersTable: dynamodb.ITable
  memberOrganizationTable: dynamodb.ITable
}

export class BackendStack extends Stack {

  public readonly api: apigateway.RestApi

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props)

    const backendLambda = new lambda.Function(this, 'BackendLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../baas-om-manager'),
      environment: {
        ORGANIZATION_TABLE_NAME: props.organizationsTable.tableName,
        MEMBER_TABLE_NAME: props.membersTable.tableName,
        MEMBER_ORGANIZATION_TABLE_NAME: props.memberOrganizationTable.tableName,
        SES_SENDER_EMAIL: 'jorge.salgadoh@outlook.com',
      },
      timeout: Duration.seconds(10),
      memorySize: 512,
    })

    props.organizationsTable.grantReadWriteData(backendLambda)
    props.membersTable.grantReadWriteData(backendLambda)
    props.memberOrganizationTable.grantReadWriteData(backendLambda)

    backendLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }),
    )

    this.api = new apigateway.RestApi(this, 'BackendApi', {
      restApiName: 'OM Manager API',
      description: 'API para gestionar organizaciones y miembros',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      deployOptions: {
        stageName: 'prod',
      },
    })

    const baasRoot = this.api.root.addResource('baas-om-manager')

    baasRoot.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(backendLambda),
      anyMethod: true,
			defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowMethods: apigateway.Cors.ALL_METHODS,
			},
    })

    const errorTopic = new sns.Topic(this, 'BackendLambdaErrorTopic', {
      displayName: 'Alarma errores Backend Lambda',
    })

    errorTopic.addSubscription(new subscriptions.EmailSubscription('jorge.salgadoh@outlook.com'))

    const errorAlarm = new cloudwatch.Alarm(this, 'BackendLambdaErrorAlarm', {
      metric: backendLambda.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alarma que se dispara si la Lambda BackendLambda falla con error',
      actionsEnabled: true,
    })

    errorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(errorTopic))

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
    })
  }

}
