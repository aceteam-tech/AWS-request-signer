const crypto = require("crypto-js")
const _ = require('lodash')

class Signer {
    constructor(credentials, request) {
        const method = request.method || 'GET'
        return _.extend(request, {
            body: method.match(/post/i) && JSON.stringify(request.body),
            headers: this.getHeaders(credentials, {
                url: request.url,
                method: method,
                query: (method.match(/get/i) ? request.body : {}),
                body: (!method.match(/get/i) ? JSON.stringify(request.body) : '')
            })
        })
    }

    getHeaders(credentials, request) {
        const date = new Date()
        const url = request.url
        credentials.host = url.host
        request.route = url.pathname.encoded

        const canonical = this.canonicalRequest(credentials, request, date)
        const toSign = this.requestToSign(canonical, credentials, date)
        const signature = this.signature(toSign, credentials, date)

        return {
            'X-Amz-Date': this.amzLongDate(date),
            'Content-Type': 'application/x-amz-json-1.0',
            'Authorization': 'AWS4-HMAC-SHA256 Credential=' + credentials.accessKeyId + '/' + this.amzShortDate(date) + '/' + credentials.region + '/execute-api/aws4_request, ' + ('SignedHeaders=content-type;host;x-amz-date' + ', Signature=' + signature)
        }
    }

    canonicalRequest(credentials, request, date) {
        return request.method.toUpperCase() + '\n' + (request.route.charAt(0) !== '/' ? '/' + request.route : request.route) + '\n' + this.queryParameters(request.query) + '\ncontent-type:application/x-amz-json-1.0\nhost:' + credentials.host + '\n' + ('x-amz-date:' + this.amzLongDate(date) + '\n' + '\n') + ('content-type;host;x-amz-date'  + '\n') + this.hashString(request.body)
    }

    requestToSign(cRequest, credentials, date) {
        return 'AWS4-HMAC-SHA256\n' + this.amzLongDate(date) + '\n' + this.amzShortDate(date) + '/' + credentials.region + '/execute-api/aws4_request\n' + this.hashString(cRequest)
    }

    signature(toSign, credentials, date) {
        return this.hmac(this.hmac(this.hmac(this.hmac(this.hmac('AWS4' + credentials.secretAccessKey, this.amzShortDate(date)), credentials.region), 'execute-api'), 'aws4_request'), toSign).toString()
    }

    queryParameters(queryParameterObj) {
        var pieces = []
        if (queryParameterObj) {
            Object.keys(queryParameterObj).sort().forEach(function (k) {
                return pieces.push(k + '=' + encodeURIComponent(queryParameterObj[k]))
            })
        }
        return pieces.length > 0 ? pieces.join('&') : ''
    }

    hashString(str) {
        return crypto.SHA256(str).toString()
    }

    hmac(key, body) {
        return crypto.HmacSHA256(body, key)
    }

    amzShortDate(date) {
        return this.amzLongDate(date).substr(0, 8)
    }

    amzLongDate(date) {
        return date.toISOString().replace(/[:\-]|\.\d{3}/g, '').substr(0, 17)
    }
}

module.exports = Signer