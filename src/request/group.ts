import HttpRequest from '@/lib/http'
import { StringDict } from '@/lib/common'

const request = new HttpRequest()

export async function getGroupActiveList (data: StringDict) {
    return await request.get({
        url: '/group/getGroupActiveList',
        data
    })
}

export async function setGroupActive (data: StringDict) {
    return await request.post({
        url: '/group/setGroupActive',
        data
    })
}

export async function getGroupFunctionList (data: StringDict) {
    return await request.get({
        url: '/group/getGroupFunctionList',
        data
    })
}

export async function setFunctionActive (data: StringDict) {
    return await request.post({
        url: '/group/setFunctionActive',
        data
    })
}
