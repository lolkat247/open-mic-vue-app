// Cognito authentication service

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js'

export interface AuthTokens {
  accessToken: string
  idToken: string
  refreshToken: string
}

export interface SignUpData {
  email: string
  password: string
  name?: string
}

export class AuthService {
  private userPool: CognitoUserPool

  constructor(userPoolId: string, clientId: string) {
    this.userPool = new CognitoUserPool({
      UserPoolId: userPoolId,
      ClientId: clientId,
      Storage: sessionStorage
    })
  }

  /**
   * Sign in with email and password
   */
  signIn(email: string, password: string): Promise<AuthTokens> {
    return new Promise((resolve, reject) => {
      const authenticationData = {
        Username: email,
        Password: password
      }

      const authenticationDetails = new AuthenticationDetails(authenticationData)
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      })

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result: CognitoUserSession) => {
          const tokens: AuthTokens = {
            accessToken: result.getAccessToken().getJwtToken(),
            idToken: result.getIdToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken()
          }
          resolve(tokens)
        },
        onFailure: (error) => {
          reject(error)
        },
        newPasswordRequired: (_userAttributes, _requiredAttributes) => {
          // Handle new password required scenario
          reject(new Error('New password required'))
        }
      })
    })
  }

  /**
   * Sign up a new user
   */
  signUp(data: SignUpData): Promise<{ user: CognitoUser; userConfirmed: boolean }> {
    return new Promise((resolve, reject) => {
      const attributeList: CognitoUserAttribute[] = []

      if (data.name) {
        attributeList.push(
          new CognitoUserAttribute({
            Name: 'name',
            Value: data.name
          })
        )
      }

      this.userPool.signUp(
        data.email,
        data.password,
        attributeList,
        [],
        (error, result) => {
          if (error) {
            reject(error)
            return
          }
          if (!result) {
            reject(new Error('Sign up failed'))
            return
          }
          resolve({
            user: result.user,
            userConfirmed: result.userConfirmed
          })
        }
      )
    })
  }

  /**
   * Confirm user registration with code
   */
  confirmRegistration(email: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      })

      cognitoUser.confirmRegistration(code, true, (error, _result) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  /**
   * Sign out the current user
   */
  signOut() {
    const currentUser = this.userPool.getCurrentUser()
    if (currentUser) {
      currentUser.signOut()
    }
  }

  /**
   * Get current user session
   */
  getCurrentSession(): Promise<CognitoUserSession | null> {
    return new Promise((resolve, reject) => {
      const currentUser = this.userPool.getCurrentUser()

      if (!currentUser) {
        resolve(null)
        return
      }

      currentUser.getSession((error: Error | null, session: CognitoUserSession | null) => {
        if (error) {
          reject(error)
          return
        }
        if (!session || !session.isValid()) {
          resolve(null)
          return
        }
        resolve(session)
      })
    })
  }

  /**
   * Get ID token from current session
   */
  async getIdToken(): Promise<string | null> {
    try {
      const session = await this.getCurrentSession()
      return session?.getIdToken().getJwtToken() ?? null
    } catch (error) {
      console.error('Failed to get ID token:', error)
      return null
    }
  }

  /**
   * Refresh the session
   */
  refreshSession(): Promise<CognitoUserSession> {
    return new Promise((resolve, reject) => {
      const currentUser = this.userPool.getCurrentUser()

      if (!currentUser) {
        reject(new Error('No current user'))
        return
      }

      currentUser.getSession((error: Error | null, session: CognitoUserSession | null) => {
        if (error) {
          reject(error)
          return
        }
        if (!session) {
          reject(new Error('No session'))
          return
        }

        const refreshToken = session.getRefreshToken()
        currentUser.refreshSession(refreshToken, (refreshError, newSession) => {
          if (refreshError) {
            reject(refreshError)
            return
          }
          resolve(newSession)
        })
      })
    })
  }

  /**
   * Request password reset
   */
  forgotPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      })

      cognitoUser.forgotPassword({
        onSuccess: () => {
          resolve()
        },
        onFailure: (error) => {
          reject(error)
        }
      })
    })
  }

  /**
   * Confirm password reset with code
   */
  confirmPassword(email: string, code: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      })

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve()
        },
        onFailure: (error) => {
          reject(error)
        }
      })
    })
  }

  /**
   * Change password for authenticated user
   */
  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const currentUser = this.userPool.getCurrentUser()

      if (!currentUser) {
        reject(new Error('No authenticated user'))
        return
      }

      currentUser.getSession((sessionError: Error | null, session: CognitoUserSession | null) => {
        if (sessionError || !session) {
          reject(sessionError || new Error('No valid session'))
          return
        }

        currentUser.changePassword(oldPassword, newPassword, (error, _result) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
    })
  }

  /**
   * Resend confirmation code
   */
  resendConfirmationCode(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool
      })

      cognitoUser.resendConfirmationCode((error, _result) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }
}