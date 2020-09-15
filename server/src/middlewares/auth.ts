import {Request, Response} from 'express';
import {redisClient} from '../controllers/auth.controllers';
import jwt from 'jsonwebtoken';
import {getValuefromRedis} from '../utils/redis.utils';


export const isAuthenticated = (req:Request, res:Response, next:any) => {
    const {authorization} = req.headers
    if (!authorization) {
        res.status(401).send('unauthorized request')
    }
    jwt.verify(<string>authorization, <string>process.env.JWT_SECRET, (err) => {
        if (err) {
            redisClient.DEL(<string>authorization)
            res.status(401).send('unauthorized request')
        }
        redisClient.get(<string>authorization, (err, reply) => {
            if (err || !reply) {
                res.status(401).send('unauthorized request')
            }
            next()
        })
    })
}


export const isSocketAuthenticated = async (authorization:string) => {
    if (!authorization) {
        return false
    }
    return jwt.verify(<string>authorization, <string>process.env.JWT_SECRET, (err) => {
        if (err) {
            redisClient.DEL(<string>authorization)
            return false
        }
        return getValuefromRedis(authorization)
        .then((value) => {
            return value
        })
    }) 
}

