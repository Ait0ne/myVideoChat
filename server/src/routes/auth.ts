import { Router } from 'express';

import {signinAuthentication, signUp, logout} from '../controllers/auth.controllers';

const AuthRouter = Router()

AuthRouter.post('/login', signinAuthentication)

AuthRouter.post('/signup', signUp)

AuthRouter.post('/logout', logout)

export default AuthRouter;
