import { Amplify } from 'aws-amplify';
import { environment } from '../../environments/environment'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolClientId,
      signUpVerificationMethod: environment.cognito.signUpVerificationMethod,
    },
  },
});
