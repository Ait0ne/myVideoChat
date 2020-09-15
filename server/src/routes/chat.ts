import { Router } from 'express';
import {isAuthenticated} from '../middlewares/auth';
import getChannel from '../controllers/chat.controllers'

const ChatRouter = Router();

ChatRouter.get('/channels', isAuthenticated, getChannel)

export default ChatRouter;