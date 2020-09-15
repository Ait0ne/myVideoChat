import User, {IUser} from '../models/user.model';
import bcrypt from 'bcryptjs';
import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import redis from 'redis';
import Token from '../models/token.models';

export const redisClient= redis.createClient(<string>process.env.REDIS_URL);

redisClient.on("error", (err) => {
    console.log(err)
})


const signToken = (email:string) => {
    const jwtPayload = email;
    const secret = <string>process.env.JWT_SECRET 
    const token = jwt.sign({ email: jwtPayload }, secret, { expiresIn: '10h'})
    return token
}

const getAuthTokenId = (authorization: string, res: Response) => {
    return redisClient.get(authorization, (err, reply) => {
        if (err || !reply) {
            return  res.status(401).json({message: 'unauthorized request'})
        }
        return jwt.verify(authorization, <string>process.env.JWT_SECRET, (err) => {
            if (err) {
                redisClient.DEL(authorization)
                return  res.status(401).json({message: 'unauthorized request'})
            }
            return User.findById(reply)
            .then( user => {
                if (!user) {
                    return  res.status(401).json({message: 'unauthorized request'})
                } 
                return res.status(200).send({ user : {
                    _id: user._id,
                    userName: user.username,
                    email: user.email,
                    channels: user.channels
                }})
            })
            .catch(() => {
                return  res.status(401).json({message: 'unauthorized request'})
            })
        })
    })
}

const handleSignIn = (req:Request) => {
    const {email, password} = req.body

    return User.findOne({email: email})
    .then((user) => {
        if (!user) {
            return Promise.reject('Wrong email or password')
        } else {
            return bcrypt.compare(password, user.password)
            .then(doMatch => {
                if (doMatch) {
                    return user
                } else {
                    return Promise.reject('Wrong email or password')
                }
            })
        }

    })
    .catch(err => {
        return Promise.reject(err)
    })
}

const setToken = (token:string, id: any) => {
    redisClient.set(token, id.toString(), redis.print)
}

const createSessions = async (user: IUser) => {
    const  { email, _id } = user
    const token = signToken(email);
    await setToken(token, _id)
    return {_id:user._id, email: user.email, userName: user.username, channels: user.channels, token}
}


export const signinAuthentication = (req:Request, res:Response) => {
    const { authorization } = req.headers;
    return authorization ? 
    getAuthTokenId(authorization, res)
    : handleSignIn(req)
    .then(user => {
        if(user._id && user.email){
            return createSessions(user)
        }
        return Promise.reject('Wrong password or email')
    })
    .then(session => res.status(200).send(session))
    .catch((err) => res.send({success: false, error: err}))
}


export const signUp = (req: Request, res: Response) => {
    const {userName, email, password} = req.body

    User.findOne({email: email })
    .then(user => {
        if (user) {
            res.send({success: false, error: 'Email belongs to another account'})
        } else {
            User.findOne({username:userName})
            .then(user  => {
                if (user) {
                    res.send({success:false,error: 'Username already taken'})
                } 
                bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        username: userName,
                        email:email,
                        password: hashedPassword
                    });
                    return user.save();
                })
                .then((user) => {
                    if(user._id && user.email){
                        return createSessions(user)
                    }
                    return Promise.reject('Failed to create User')
                })
                .then(session => res.status(200).send(session))
                .catch(() => res.send({success:false, error: 'Failed to create User'}))
            })

        }
    })
    .catch(() => {
        res.send({success:false, error: 'Failed to create User'})
    })

}


export const logout = (req: Request, res: Response) => {
    const { authorization } = req.headers
    const {userID} = req.body
    if (!authorization) {
        res.status(500).send({message:'failed to logout, wrong token'})
    }
    console.log(userID)
    Token.findOneAndRemove({user:userID})
    .then(doc => {
        console.log(doc)
    })
    redisClient.DEL(<string>authorization)
    res.status(200).send({success: true})
}