import { Injectable, signal } from '@angular/core'

interface Tokens {
  idToken: string | null
  accessToken: string | null
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private _tokens = signal<Tokens>({ idToken: null, accessToken: null })
  readonly tokens = this._tokens.asReadonly()

  private _isLoggedIn = signal(false)
  readonly isLoggedIn = this._isLoggedIn.asReadonly()

  constructor() {
    
    const storedTokens = localStorage.getItem('tokens')

    if (storedTokens) {
      this._tokens.set(JSON.parse(storedTokens))
      this._isLoggedIn.set(true)
    }
		
  }

  setTokens(tokens: Tokens) {
    this._tokens.set(tokens)
    localStorage.setItem('tokens', JSON.stringify(tokens))
    this._isLoggedIn.set(true)
  }

  clearTokens() {
    this._tokens.set({ idToken: null, accessToken: null })
    localStorage.removeItem('tokens')
    this._isLoggedIn.set(false)
  }
}
