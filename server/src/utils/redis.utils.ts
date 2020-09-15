import {redisClient} from '../controllers/auth.controllers';
import {promisify} from 'util';

export const getValuefromRedis = async(key:string) => {
    const getAsync = promisify(redisClient.get).bind(redisClient)
    const value = await getAsync(key)
    return value
}


export const addCurrentUser = (userId:string, socketId:string) => {
    return Promise.resolve(redisClient.set(userId, socketId))
}


export const removeCurrentUser = (userId:string) => {
    return Promise.resolve(redisClient.DEL(userId, (result) => console.log(result)))
}