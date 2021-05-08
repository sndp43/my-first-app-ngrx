import { Action } from '@ngrx/store';

export const LOGIN_START = '[Auth] Login start';
export const AUTHENTICATE_SUCCESS = '[Auth] Login';
export const AUTHENTICATE_FAIL = '[Auth] Login fail';
export const SIGNUP_START = '[Auth] Signup Start';
export const LOGOUT = '[Auth] Logout';
export const CLEAR_ERROR = '[Auth] Clear Error';
export const AUTO_LOGIN = '[Auth] Auto Login';

//AutoLogin Action
/*
Auto login action will be call at component.ts (root component level)
*/
export class AutoLogin implements Action{
  readonly type = AUTO_LOGIN;
}


//Clear Error Action
/*
when Clear Error action is dispatched it will go to reducer to cleare error state and return new state
*/
export class ClearError implements Action{
  readonly type = CLEAR_ERROR;
}

//Signup Start Action
/*
when Signup Start action is dispatched it will goto login "authSignup" effect
*/

export class SignupStart implements Action{
  readonly type = SIGNUP_START;
  constructor(public payload:{email: string, password: string}){}
}


//Login Start Action
/*
when login start action is dispatched it will goto login "authLogin" effect
*/
export class LoginStart implements Action {
  readonly type = LOGIN_START;
  constructor(
    public payload: {
      email: string;
      password: string;
    }
  ) {}
}

//Login Suucess Action
export class Authenticate_success implements Action {
  readonly type = AUTHENTICATE_SUCCESS;

  constructor(
    public payload: {
      email: string;
      userId: string;
      token: string;
      expirationDate: Date;
      redirect:boolean;
    }
  ) {}
}


//Login Fail Action
export class Authenticate_fail implements Action {
  readonly type = AUTHENTICATE_FAIL;
  constructor(
    public payload:string
  ) {}
}

//Logout Action
/*
  on logout "authRedirect" effect will be called too for redirection
*/
export class Logout implements Action {
  readonly type = LOGOUT;
  constructor() {}
}

export type AuthActions =
Authenticate_success |
LoginStart |
Authenticate_fail |
Logout |
SignupStart|
ClearError|
AutoLogin;
