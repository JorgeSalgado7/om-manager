import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as cognito from 'aws-cdk-lib/aws-cognito'

export class CognitoStack extends Stack {

  public readonly userPool: cognito.UserPool
  public readonly userPoolClient: cognito.UserPoolClient

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    this.userPool = new cognito.UserPool(this, 'OMUserPool', {
      userPoolName: 'om-manager',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      userVerification: {
        emailSubject: 'Tu código de verificación para OM Manager',
        emailBody: 'Tu código de verificación es: {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    this.userPoolClient = new cognito.UserPoolClient(this, 'OMUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'om-manager-client',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    })

    // Outputs
    new CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      exportName: 'OMUserPoolId',
    })

    new CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      exportName: 'OMUserPoolClientId',
    })
  }
}
