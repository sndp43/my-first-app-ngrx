import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { AuthService } from "../auth.service";
import { User } from "../user.model";
import * as AuthActions from "./auth.actions";

 interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

/**
 *
 * @param resData
 * this will be called to after every Login/Sign Up
 * @returns
 */
const handleAuthentication = (resData)=>{
  //create expirationDate
  const expirationDate = new Date(new Date().getTime() + +resData.expiresIn * 1000);
  const user = new User(resData.email,resData.localId,resData.idToken,expirationDate);

  localStorage.setItem('userData', JSON.stringify(user));

  return new AuthActions.Authenticate_success({
    email:resData.email,
    userId:resData.localId,
    token:resData.idToken,
    expirationDate:expirationDate,
    redirect:true
  })
}

const handleError = (errorRes)=>{

  let errorMessage = 'An unknown error occurred!';
  if (!errorRes.error || !errorRes.error.error) {
    return of(new AuthActions.Authenticate_fail(errorMessage));
  }
  switch (errorRes.error.error.message) {
    case 'EMAIL_EXISTS':
      errorMessage = 'This email exists already';
      break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'This email does not exist.';
        break;
        case 'INVALID_PASSWORD':
          errorMessage = 'This password is not correct.';
          break;
        }

        //here we are using of() because "catchError" from which this is called would not automatically wrap it ino observable
        return of(new AuthActions.Authenticate_fail(errorMessage));

      }

      //injectable is required as things needs to be injected in the class as we can see in the constructor
      @Injectable()

      export class AuthEffects{
        constructor(
          private actions$:Actions,
          private http:HttpClient,
          private router:Router,
          private authserv:AuthService
          ){}

          //AUTO LOGIN EFFECT

          @Effect()
          authAutoLogin = this.actions$.pipe(
            ofType(AuthActions.AUTO_LOGIN),
            map(()=>{

                        //check if userdata exist in local storage
                      const userData:
                      {
                        email: string;
                        id: string;
                        _token: string;
                        _tokenExpirationDate: string;
                      } = JSON.parse(localStorage.getItem('userData'));

                      //if not no need to auto login just return dummy action
                      if (!userData)
                      {
                        //effect has to auto dispatch proceeding action as follows
                        return {type:"DUMMY"};
                      }

                      //if found create user
                      const loadedUser = new User(
                        userData.email,
                        userData.id,
                        userData._token,
                        new Date(userData._tokenExpirationDate)
                      );

                      //check token from created user
                      if (loadedUser.token)
                      {


                         //set logout timer
                         //create expiration time in ms
                            const expirationDuration =
                              new Date(userData._tokenExpirationDate).getTime() -
                              new Date().getTime();

                            this.authserv.setLogoutTimer(+expirationDuration);

                        //set auth area in store to user
                        //effect will auto dispatch proceeding action as follows
                              return   new AuthActions.Authenticate_success({
                                        email: loadedUser.email,
                                        userId: loadedUser.id,
                                        token: loadedUser.token,
                                        expirationDate: new Date(userData._tokenExpirationDate),
                                        redirect:false
                                  })

                      }else{
                        //effect has to auto dispatch proceeding action as follows
                        return {type:"DUMMY"};
                      }
            })
          )

  //SIGN UP EFFECT
          @Effect()
          authSignup = this.actions$.pipe(
            ofType(AuthActions.SIGNUP_START),
            switchMap((signupAction:AuthActions.SignupStart)=>{

             return this.http
            .post<AuthResponseData>
            (
              'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=' +
                environment.firebaseAPIKey,
              {
                email: signupAction.payload.email,
                password: signupAction.payload.password,
                returnSecureToken: true
              }
            ).pipe(
                     tap((resData)=>{
                       //set LogOut time
                       this.authserv.setLogoutTimer(+resData.expiresIn * 1000)
                     }),
                     map((resData)=>{
                              //handle response
                              //map will wrap the retured data as observable

                              return handleAuthentication(resData);
                        }),
                        catchError((errorRes)=>{
                          //handle error

                          //calling map first and then catchError because if any error occurs map would not be called but catchError
                          //but if we had called catchError first and then map() and
                          //if error occurs catcError would have got called and the whole observable would have got terminated

                          return handleError(errorRes);


                        })
                  )

      })

    )

  //LOGIN EFFECT

  //@Effect will make authLogin as effect and it will auto dispatch the next action
  //"ofType" determines which action/actions  eg. "ofType(AuthActions.LOGIN_START,AuthActions.Logout)" is going to trigger "authLogin" effect

  //Note :- every effect in the end will dispatch the proceeding ACTION so it should not terminate with error
  @Effect()
  authLogin = this.actions$.pipe(
    ofType(AuthActions.LOGIN_START),
    switchMap((authData:AuthActions.LoginStart)=>{

       return  this.http
          .post<AuthResponseData>(
            'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=' +
              environment.firebaseAPIKey,
            {
              email: authData.payload.email,
              password: authData.payload.password,
              returnSecureToken: true
            }
          ).pipe(
                  tap((resData)=>{
                      //set LogOut time
                       this.authserv.setLogoutTimer(+resData.expiresIn * 1000)
                     }),
                  map((resData)=>{
                        //handle Response

                        //map will wrap the retured data as observable
                        //create expirationDate
                        return handleAuthentication(resData);

                  }),
                  catchError((errorRes)=>{
                    //handle Error

                    //calling map first and then catchError because if any error occurs map would not be called but catchError
                    //but if we had called catchError first and then map() and
                    //if error occurs catcError would have got called and the whole observable would have got terminated

                    return handleError(errorRes);
                  })
          )

    })
  )
  //AUTH SUCCESS EFFECT

  //creating effect for successfull Login i.e. for "Login" Action
  //Note :- every effect in the end will dispatch the proceeding ACTION though we can suppress it as follows "@Effect({dispatch:false})"
  @Effect({dispatch:false})
  authRedirect = this.actions$.pipe(
    ofType(AuthActions.AUTHENTICATE_SUCCESS),
    tap((authSuccessAction:AuthActions.Authenticate_success)=>{

      if(authSuccessAction.payload.redirect){
        this.router.navigate(['/']);
      }

    })
  )


//LOGOUT EFFECT

//on logout action clear userdata from localstorage and redirect to auth
  @Effect({dispatch:false})
  authLogout = this.actions$.pipe(
    ofType(AuthActions.LOGOUT),
    tap(()=>{

            //remember we set logout time well its time to clear the timer
            this.authserv.clearLogoutTimer();
            //clear local session
            localStorage.removeItem('userData');
            //navigate to authentication
            this.router.navigate(['/auth']);
    })
  )


}
